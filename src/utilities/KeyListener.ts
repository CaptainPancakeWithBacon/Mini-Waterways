/**
 * This class handles the keyboard events. It knows the last known state of its
 * keys
 *
 * Some parts of this class are pretty complex, but the class itself is fairly
 * easy to use. You just instantiate one object in your game and us the method
 * `isKeyDown()` to check if a specific key is currently pressed down by the
 * user.
 *
 * NOTE: It is known that the MouseEvent.keyCode property is deprecated, which
 * means that there will be a moment that this class will not work anymore.
 *
 * @author BugSlayer
 * @author Frans Blauw
 */

export default class KeyListener {
  // Some convenient key codes already defined here. If you need a specific
  // keycode, see:https://keycode.info/
  public static readonly KEY_ENTER = 'Enter';

  public static readonly KEY_SHIFT_LEFT = 'ShiftLeft';

  public static readonly KEY_SHIFT_RIGHT = 'ShiftRight';

  public static readonly KEY_CTRL_LEFT = 'ControlLeft';

  public static readonly KEY_CTRL_RIGHT = 'ControlRight';

  public static readonly KEY_ALT_LEFT = 'AltLeft';

  public static readonly KEY_ALT_RIGHT = 'AltRight';

  public static readonly KEY_ESC = 'Escape';

  public static readonly KEY_SPACE = 'Space';

  public static readonly KEY_LEFT = 'ArrowLeft';

  public static readonly KEY_UP = 'ArrowUp';

  public static readonly KEY_RIGHT = 'ArrowRight';

  public static readonly KEY_DOWN = 'ArrowDown';

  public static readonly KEY_DEL = 'Delete';

  public static readonly KEY_1 = 'Digit1';

  public static readonly KEY_2 = 'Digit2';

  public static readonly KEY_3 = 'Digit3';

  public static readonly KEY_4 = 'Digit4';

  public static readonly KEY_5 = 'Digit5';

  public static readonly KEY_6 = 'Digit6';

  public static readonly KEY_7 = 'Digit7';

  public static readonly KEY_8 = 'Digit8';

  public static readonly KEY_9 = 'Digit9';

  public static readonly KEY_0 = 'Digit0';

  public static readonly KEY_A = 'KeyA';

  public static readonly KEY_B = 'KeyB';

  public static readonly KEY_C = 'KeyC';

  public static readonly KEY_D = 'KeyD';

  public static readonly KEY_E = 'KeyE';

  public static readonly KEY_F = 'KeyF';

  public static readonly KEY_G = 'KeyG';

  public static readonly KEY_H = 'KeyH';

  public static readonly KEY_I = 'KeyI';

  public static readonly KEY_J = 'KeyJ';

  public static readonly KEY_K = 'KeyK';

  public static readonly KEY_L = 'KeyL';

  public static readonly KEY_M = 'KeyM';

  public static readonly KEY_N = 'KeyN';

  public static readonly KEY_O = 'KeyO';

  public static readonly KEY_P = 'KeyP';

  public static readonly KEY_Q = 'KeyQ';

  public static readonly KEY_R = 'KeyR';

  public static readonly KEY_S = 'KeyS';

  public static readonly KEY_T = 'KeyT';

  public static readonly KEY_U = 'KeyU';

  public static readonly KEY_V = 'KeyV';

  public static readonly KEY_W = 'KeyW';

  public static readonly KEY_X = 'KeyX';

  public static readonly KEY_Y = 'KeyY';

  public static readonly KEY_Z = 'KeyZ';

  /**
   * Record that holds a boolean for each keycode. The keycode is the index of
   * the array and the boolean is the state of that key (`true` means that
   * the key is down).
   */
  private static keyDown: Record<string, boolean> = {};

  private static keyPressedQueried: Record<string, boolean> = {};

  /**
   * Constructs a new KeyListener.
   */
  public constructor() {
    // Register the arrow methods as listeners to keyevents
    // There is a third event ('keypress'), but we do not need to use it
    window.addEventListener('keydown', (ev: KeyboardEvent) => {
      KeyListener.keyDown[ev.code] = true;
    });
    window.addEventListener('keyup', (ev: KeyboardEvent) => {
      KeyListener.keyDown[ev.code] = false;
      KeyListener.keyPressedQueried[ev.code] = false;
    });
  }

  /**
   * Returns `true` if and only if the last known state of the keyboard
   * reflects that the specified key is currently pressed.
   *
   * @param keyCode the keyCode to check
   * @returns `true` when the specified key is currently down
   */
  public static isKeyDown(keyCode: string): boolean {
    return this.keyDown[keyCode] === true;
  }

  /**
   * @param keyCode the keycode to check
   * @returns 'true' when the specified key is pressed
   */
  public static keyPressed(keyCode: string): boolean {
    if (this.keyPressedQueried[keyCode] === true) return false;
    if (this.keyDown[keyCode] === true) {
      this.keyPressedQueried[keyCode] = true;
      return true;
    }
    return false;
  }
}
