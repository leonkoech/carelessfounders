#!/usr/bin/env python3
"""Send a GPIO2 blink sequence to the ESP32 over MicroPython REPL."""
import serial
import time
import sys

PORT = sys.argv[1] if len(sys.argv) > 1 else "/dev/ttyUSB0"
COUNT = int(sys.argv[2]) if len(sys.argv) > 2 else 10

code = f"""
from machine import Pin
import time
led = Pin(2, Pin.OUT)
print("Blinking GPIO2 x{COUNT}...")
for i in range({COUNT}):
    led.value(1)
    time.sleep(0.25)
    led.value(0)
    time.sleep(0.25)
print("Done")
"""

ser = serial.Serial(PORT, 115200, timeout=1)
time.sleep(0.5)
ser.reset_input_buffer()
ser.write(b"\r\x03\r\x03")
time.sleep(0.3)
ser.write(b"\x01")  # raw REPL
time.sleep(0.3)
ser.read(ser.in_waiting or 1)
ser.write(code.encode())
ser.write(b"\x04")  # execute
time.sleep(COUNT * 0.5 + 2)
print(ser.read(ser.in_waiting or 2000).decode(errors="replace"))
ser.write(b"\x02")
ser.close()
