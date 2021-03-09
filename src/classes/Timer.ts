let heightLeft = 0;
let heightRight = 0;

export default class Timer {
  prefix: string;
  placement: string;
  interval: number | null;
  startTime: number;
  endTime: number;
  duration: number;

  constructor(
    prefix: string = "",
    placement: string = "left",
    interval: number | null = null
  ) {
    this.prefix = prefix;
    this.placement = placement;
    this.interval = interval;
    this.startTime = 0;
    this.endTime = 0;
    this.duration = 0;

    return this;
  }

  start(): Timer {
    this.startTime = window.performance.now();

    return this;
  }

  end(): number {
    this.endTime = window.performance.now();
    this.duration =
      Math.round(((this.endTime - this.startTime) / 1000) * 10000) / 10000;

    const div = document.createElement("div");
    div.style.position = "absolute";
    if (this.placement === "left") {
      div.style.left = "0";
      div.style.top = `${heightLeft}px`;
      heightLeft += 20;
    } else {
      div.style.right = "0";
      div.style.top = `${heightRight}px`;
      heightRight += 20;
    }
    div.style.paddingLeft = "10px";
    div.style.paddingRight = "10px";
    div.style.color = "white";
    div.style.backgroundColor = "gray";
    div.innerHTML = `<div>${this.prefix}: ${this.duration} seconds</div>`;
    document.getElementById("root")?.appendChild(div);

    return this.duration;
  }
}
