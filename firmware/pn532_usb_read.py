#!/usr/bin/env python3
"""Read NFC UIDs from USB-C PN532 (CH340/HSU), log realtime, optional bridge POST.

Usage:
  python pn532_usb_read.py
  python pn532_usb_read.py --once
  python pn532_usb_read.py --post
  python pn532_usb_read.py --log /path/to/taps.log
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone

import serial

PORT = "/dev/ttyUSB0"
BAUD = 115200
DEFAULT_LOG = "/home/sherzoy-jan/Files/miami_hackathon/carelessfounders/firmware/taps.log"


class Logger:
    def __init__(self, path: str | None) -> None:
        self.path = path
        self.fp = open(path, "a", buffering=1) if path else None  # line-buffered

    def log(self, msg: str) -> None:
        ts = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line, flush=True)
        if self.fp:
            self.fp.write(line + "\n")
            self.fp.flush()

    def close(self) -> None:
        if self.fp:
            self.fp.close()


def frame(data: bytes) -> bytes:
    length = len(data)
    lcs = (~length + 1) & 0xFF
    body = bytes([0x00, 0x00, 0xFF, length, lcs]) + data
    dcs = (~sum(data) + 1) & 0xFF
    return body + bytes([dcs, 0x00])


def read_frame(ser: serial.Serial, timeout: float = 1.0) -> bytes | None:
    end = time.time() + timeout
    buf = bytearray()
    while time.time() < end:
        chunk = ser.read(64)
        if chunk:
            buf.extend(chunk)
            i = 0
            while i + 5 <= len(buf):
                if buf[i : i + 3] == b"\x00\x00\xff":
                    if buf[i + 3 : i + 6] == b"\x00\xff\x00":
                        i += 6
                        continue
                    length = buf[i + 3]
                    if length in (0xFF, 0x00):
                        i += 1
                        continue
                    total = 5 + length + 2
                    if i + total <= len(buf):
                        return bytes(buf[i + 5 : i + 5 + length])
                    break
                i += 1
        else:
            time.sleep(0.01)
    return None


def cmd(ser: serial.Serial, data: bytes, timeout: float = 1.0) -> bytes | None:
    ser.reset_input_buffer()
    wake = bytes([0x55, 0x55]) + bytes(14)
    ser.write(wake + frame(data))
    return read_frame(ser, timeout=timeout)


def sam_config(ser: serial.Serial) -> bool:
    # SAMConfiguration: mode=normal (0x01), timeout=0x14, irq=0
    resp = cmd(ser, bytes([0xD4, 0x14, 0x01, 0x14, 0x00]))
    return bool(resp and resp[:2] == b"\xD5\x15")


def get_firmware(ser: serial.Serial) -> str:
    resp = cmd(ser, bytes([0xD4, 0x02]))
    if not resp or len(resp) < 6 or resp[0] != 0xD5 or resp[1] != 0x03:
        raise RuntimeError(f"No PN532 firmware response: {resp!r}")
    ic, ver, rev, support = resp[2], resp[3], resp[4], resp[5]
    return f"IC=0x{ic:02X} ver={ver}.{rev} support=0x{support:02X}"


def read_uid(ser: serial.Serial) -> str | None:
    resp = cmd(ser, bytes([0xD4, 0x4A, 0x01, 0x00]), timeout=0.6)
    if not resp or len(resp) < 8 or resp[0] != 0xD5 or resp[1] != 0x4B:
        return None
    if resp[2] < 1:
        return None
    nfcid_len = resp[7]
    if nfcid_len < 4 or 8 + nfcid_len > len(resp):
        return None
    return resp[8 : 8 + nfcid_len].hex().upper()


def post_tap(uid: str, log: Logger) -> None:
    body = json.dumps({"uid": uid, "source": "esp32"}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:7071/tap",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=2) as r:
            log.log(f"posted uid={uid} status={r.status}")
    except Exception as e:
        log.log(f"post failed uid={uid}: {e}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", default=PORT)
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--post", action="store_true")
    ap.add_argument("--log", default=DEFAULT_LOG, help="realtime log file path")
    ap.add_argument("--no-log", action="store_true")
    args = ap.parse_args()

    log = Logger(None if args.no_log else args.log)
    ser = serial.Serial(args.port, BAUD, timeout=0.1)
    time.sleep(0.2)
    try:
        info = get_firmware(ser)
        if not sam_config(ser):
            log.log("WARN: SAMConfiguration failed (continuing anyway)")
        log.log(f"PN532 OK — {info} port={args.port}")
        log.log(f"logging → {args.log if not args.no_log else '(stdout only)'}")
        log.log("Tap a card… (Ctrl+C to stop)")
        last = None
        last_t = 0.0
        while True:
            uid = read_uid(ser)
            now = time.time()
            if uid and (uid != last or now - last_t > 1.0):
                log.log(f"UID: {uid}")
                if args.post:
                    post_tap(uid, log)
                last, last_t = uid, now
                if args.once:
                    return 0
            time.sleep(0.05)
    except KeyboardInterrupt:
        log.log("stopped")
        return 0
    except Exception as e:
        log.log(f"error: {e}")
        return 1
    finally:
        ser.close()
        log.close()


if __name__ == "__main__":
    raise SystemExit(main())
