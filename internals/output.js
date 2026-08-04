(() => {
  "use strict";

  const ascii = [
    "                                                ,---. ",
    "                ,--.     ,--.                   |   | ",
    ",--. ,--.,--,--.|  ,---. |  ,---.  ,---.  ,---. |  .' ",
    " \\  '  /' ,-.  ||  .-.  ||  .-.  || .-. || .-. ||  |  ",
    "  \\   ' \\ '-'  ||  | |  ||  | |  |' '-' '' '-' '`--'  ",
    ".-'  /   `--`--'`--' `--'`--' `--' `---'  `---' .--.  ",
    "`---'                                           '--'  ",
    "----------------------------------------------------",
    "You're not supposed to be here. :)",
    "Since you are, head over to our main site instead:",
    "https://mien.works"
  ].join("\n");

  console.log(`%c${ascii}`, "background: #000; color: #e74a5f; font-family: monospace;");
})();
