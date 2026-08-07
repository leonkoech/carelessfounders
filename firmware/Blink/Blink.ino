// ESP32-WROOM-32 onboard LED blink (GPIO 2 on most DevKit boards)
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Blink ready on GPIO 2");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("ON");
  delay(500);
  digitalWrite(LED_PIN, LOW);
  Serial.println("OFF");
  delay(500);
}
