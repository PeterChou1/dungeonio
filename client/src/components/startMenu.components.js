import * as React from "jsx-dom";


const Controls = () => {
  return (
    <div style="color: white;">
      <ul>
        <div>
          <li>WASD - movement</li>
        </div>
        <div>
          <li>O - Weak attack</li>
        </div>
        <div>
          <li>P - Strong attack</li>
        </div>
        <div>
          <li>SPACE - Roll/Block</li>
        </div>
        <div>
          <li>SHIFT - Run</li>
        </div>
      </ul>
    </div>
  );
};

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
                const startdata = {
                  playerName: textbox.current.value
                    ? textbox.current.value.slice(0, 15)
                    : "unnamed warrior",
                  ...(props.start.sessionId && {
                    sessionId: props.start.sessionId,
                    roomId: props.start.roomId,
                    client: props.start.client,
                  }),
                };
                if (props.start.hasOwnProperty("sessionId")) {
                  props.start.scene.start("startLevel", startdata);
                } else {
                  props.start.scene.start("bootScene", startdata);
                }
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

export { StartMenu, Controls };
