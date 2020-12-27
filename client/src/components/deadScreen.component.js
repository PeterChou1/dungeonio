import * as React from "jsx-dom";

/**
 * @description dead menu
 */
const DeadScreen = (props) => {
  return (
    <div>
      <div>
        <h1 style="color: white; font-size: 40px;">You Died</h1>
      </div>
      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <div class="control">
              <button
                onClick={() => {
                  props.restart.scene.start("mainMenu", {
                    client: props.restart.client,
                  });
                }}
                class="button is-primary"
              >
                <span class="icon">
                  <i class="mdi mdi-gamepad"></i>
                </span>
                <span>Restart?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DeadScreen };
