
export type ControlAction =
  | "forward" // Desktop: Both motors forward
  | "backward" // Desktop: Both motors backward
  | "turn_left" // Desktop: Left motor backward, Right motor forward
  | "turn_right" // Desktop: Left motor forward, Right motor backward
  | "stop_all" // Desktop & Mobile: All motors stop
  | "left_motor_forward" // Joystick: Left motor moves forward
  | "left_motor_backward" // Joystick: Left motor moves backward
  | "left_motor_stop" // Joystick release: Left motor stops
  | "right_motor_forward" // Joystick: Right motor moves forward
  | "right_motor_backward" // Joystick: Right motor moves backward
  | "right_motor_stop"; // Joystick release: Right motor stops
