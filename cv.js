// cv.js — print interaction
(() => {
  "use strict";

  const init = () => {
    const printButton = document.getElementById("printButton");

    if (!printButton) {
      return;
    }

    printButton.addEventListener("click", () => {
      window.print();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
