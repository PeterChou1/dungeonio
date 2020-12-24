import * as React from "jsx-dom";

/**
 * @description welcome menu
 */
const StartMenu = (props) => {
  const textbox = React.createRef();
  return (
    <div class="field is-horizontal">
      <div>
        <label class="label" style="color: white;">
          Enter Your Name
        </label>
      </div>
      <div class="field-body">
        <div class="field">
          <div class="control">
            <input
              class="input"
              type="text"
              ref={textbox}
              maxLength="15"
              placeholder="unnamed warrior"
            ></input>
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button
              onClick={() => {
                props.scene.start("bootScene", {
                  playerName: textbox.current.value
                    ? textbox.current.value
                    : "unnamed warrior",
                });
              }}
              class="button is-primary"
            >
              <span class="icon">
                <i class="mdi mdi-gamepad"></i>
              </span>
              <span>Play</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StartMenu };
