// CANVAS -------------------------------------------------------------------------------------------

const CANVAS = {
    STARS: { min: 84, max: 164 },
    BACKGROUND_MOONS: { min: 2, max: 7 },
    FOREGROUND_MOONS: { min: 3, max: 5 },
  };
  
  
  class Canvas {
    constructor() { // TODO: make this take some page props like (W, H, scrollLength)
      const canvas = document.getElementById("pix");
      this.ctx = canvas.getContext("2d");
  
      // properties
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      canvas.width = this.W;
      canvas.height = this.H;
      this.shorterSide = Math.min(this.W, this.H);
      this.diagonal = distance({ x: 0, y: 0 }, { x: this.W, y: this.H });
  
      // user position
      this.angle = 0;
      this.strength = 0;
      this.scrollPercent = 0;
  
      // user input
      this.onMouseMove = this.onMouseMove.bind(this);
      $(document).mousemove((e) => {
        const mouse = {
          x: e.clientX,
          y: e.clientY,
        };
        this.onMouseMove(mouse);
      });
      
      this.onScroll = this.onScroll.bind(this);
      $(document).scroll(() => {
        const scroll = $(window).scrollTop();
        this.onScroll(scroll);
      });
  
      // setup and animate
      this.setup();
      this.animate = this.animate.bind(this);
      this.start();
    }
  
    setup() {
      // add things to bodies in order from bottom to top
      this.space = new Space(this);
      this.bodies = [];
  
      const starCount = Random.prop(CANVAS.STARS);
      for (let i = 0; i < starCount; ++i) {
        this.bodies.push(new Star(this, 0, i));
      }
  
      const starCount2 = Random.prop(CANVAS.STARS);
      for (let i = 0; i < starCount2; ++i) {
        this.bodies.push(new Star(this, 1, i));
      }
  
      const bgMoonCount = Random.prop(CANVAS.BACKGROUND_MOONS);
      for (let i = 0; i < bgMoonCount; ++i) {
        this.bodies.push(new Moon(this, 2, i));
      }
  
      const bgMoonCount2 = Random.prop(CANVAS.BACKGROUND_MOONS);
      for (let i = 0; i < bgMoonCount2; ++i) {
        this.bodies.push(new Moon(this, 3, i));
      }
  
      this.bodies.push(new Planet(this, 4, 0));
      this.bodies.push(new Ship(this, 5, 0)); // TODO: SET LAYERS AS NAMES SHIP_LAYER
  
      const fgMoonCount = Random.prop(CANVAS.FOREGROUND_MOONS);
      for (let i = 0; i < fgMoonCount; ++i) {
        this.bodies.push(new Moon(this, 6, i));
      }
  
      const fgMoonCount2 = Random.prop(CANVAS.FOREGROUND_MOONS);
      for (let i = 0; i < fgMoonCount2; ++i) {
        this.bodies.push(new Moon(this, 7, i));
      }
  
      const starCount3 = Random.prop(CANVAS.STARS);
      for (let i = 0; i < starCount3; ++i) {
        this.bodies.push(new Star(this, 8, i));
      }
    }
  
    drawFrame() {
      this.space.drawBackground();
      this.bodies.forEach((body) => {
        body.move();
        body.draw();
      });
    }
  
    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.animate();
      }
    }
  
    animate() {
      // for(let i = 0; i < 10; ++i)
      this.drawFrame();
      this.animationReq = window.requestAnimationFrame(this.animate.bind(this));
    }
  
    stop() {
      if (!!this.animationReq) {
        window.cancelAnimationFrame(this.animationReq);
      }
      this.isRunning = false;
    }
  
    onMouseMove(mouse) {
      const center = {
        x: this.W / 2,
        y: this.H / 2,
      };
      this.angle = Math.atan2(mouse.y - center.y, mouse.x - center.x);
      this.strength = distance(center, mouse) / (this.diagonal / 2);
    }
  
    onScroll(scroll) {
      this.scrollPercent = Math.min(scroll / (this.H * 3), 1);
    }
  
  }
  
  // CANVAS -------------------------------------------------------------------------------------------
  
  class Space {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.ctx;
    }
  
    drawBackground() {
      this.ctx.beginPath();
      this.ctx.rect(0, 0, this.canvas.W, this.canvas.H);
      this.ctx.fillStyle = "#1c1c1c";
      this.ctx.fill();
    }
  }
  
  // BODIES ---------------------------------------------------------------------------------------------
  
  const BODY = {
    COLOR: {
      ANGULAR_VELOCITY: { min: 0.001, max: 0.003 },
      RESIZE_FREQUENCY: { min: 0.1, max: 0.3 },
      DISTANCE_FROM_CENTER: { min: 1 / 4, max: 1 / 3 },
      OVERLAY_OPACITY_INSIDE: 0.2,
      OVERLAY_OPACITY_OUTSIDE: 0.8,
    },
    TRAIL: {
      OPACITY_OUTSIDE: 0.08,
      OPACITY_INSIDE: 0.01,
      COLOR_STOP: 0.25,
    },
  };
  
  class Body {
    constructor(canvas, layer, id) {
      // general info
      this.canvas = canvas;
      this.ctx = this.canvas.ctx;
      this.id = `${layer}-${id}`;
      this.layer = layer;
  
      // variables
      this.prop = {};
      this.state = {};
  
      // run the setup function defined in the child class
      this.setup();
      this.prop.layerStrength =
        Random.dec(0.9, 1.1) * (18 / (0.1 * layer + 0.8) + 4); // TODO: use constant
  
      // changing position initial state
      this.state.pos = { x: this.prop.center.x, y: this.prop.center.y };
      this.state.offset = { x: 0, y: 0 };
      this.setOffsetTo();
    }
  
    setupColors() {
      const dir = Random.bool() ? 1 : -1;
      this.prop.colorProp = {
        angularVelocity: dir * Random.prop(BODY.COLOR.ANGULAR_VELOCITY),
        resizeFrequency: Random.prop(BODY.COLOR.RESIZE_FREQUENCY),
      };
      // color is relative to the actual center
      this.state.colorPos = {
        angle: Random.dec(-Math.PI, Math.PI),
        distanceFromCenter: Random.prop2(
          BODY.COLOR.DISTANCE_FROM_CENTER,
          this.prop.radius
        ),
      };
    }
  
    setOffsetTo() {
      const angle = Random.dec(-Math.PI, Math.PI);
      const radius = Random.dec(0, this.prop.offsetRadiusMax);
      this.state.offset.to = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    }
  
    hasReachedOffset() {
      const { offset } = this.state;
      const dist = distance(offset, offset.to);
      return dist < 4;
    }
  
    getMouseShiftedCenter() {
      const { angle, strength } = this.canvas;
      const { center, layerStrength } = this.prop;
      return {
        x: center.x + layerStrength * strength * Math.cos(angle),
        y: center.y + layerStrength * strength * Math.sin(angle),
      };
    }
  
    getScrollShiftedCenter() {
      const { scrollPercent } = this.canvas;
      const { layerStrength, scrollShiftRate } = this.prop;
      const deltaPercent = scrollPercent - SHIP.BACKPEDAL;
      return {
        x: (deltaPercent > 0) ? deltaPercent * layerStrength * scrollShiftRate : 0,
        y: 0
      };
    }
  
  
    moveBody(shift) {
      // move to a point at a random and angle from center
      if (this.hasReachedOffset()) {
        this.setOffsetTo();
      }
  
      // calculate the delta x and y for the new
      const { x, y, to } = this.state.offset;
      const offsetAngle = Math.atan2(to.y - y, to.x - x);
      this.state.offset.x = x + this.prop.offsetSpeed * Math.cos(offsetAngle);
      this.state.offset.y = y + this.prop.offsetSpeed * Math.sin(offsetAngle);
  
      this.state.pos = {
        x: shift.x + this.state.offset.x,
        y: shift.y + this.state.offset.y,
      };
    }
  
    moveColors() {
      const { colorProp, radius } = this.prop;
      this.state.colorPos.angle =
        this.state.colorPos.angle + colorProp.angularVelocity;
      const oscillationAngle =
        Math.PI * colorProp.resizeFrequency * this.state.colorPos.angle;
      const oscillation = 0.5 * Math.sin(oscillationAngle) + 1;
      const min = radius * BODY.COLOR.DISTANCE_FROM_CENTER.min;
      const max = radius * BODY.COLOR.DISTANCE_FROM_CENTER.max;
      this.state.colorPos.smallRadius = min + oscillation * max;
      this.state.colorPos.distanceFromCenter =
        radius * (1 - BODY.COLOR.DISTANCE_FROM_CENTER.min) -
        this.state.colorPos.smallRadius;
    }
  
    drawSpectrum() {
      // planet
      const { colorSpectrum, radius } = this.prop;
      const { colorPos, pos } = this.state;
      const colorDelta = {
        x: colorPos.distanceFromCenter * Math.cos(colorPos.angle),
        y: colorPos.distanceFromCenter * Math.sin(colorPos.angle),
        r: radius - colorPos.smallRadius,
      };
      for (let i = 0; i < colorSpectrum.length; ++i) {
        this.ctx.beginPath();
        this.ctx.arc(
          pos.x - (colorDelta.x * i) / colorSpectrum.length,
          pos.y - (colorDelta.y * i) / colorSpectrum.length,
          radius - (colorDelta.r * i) / colorSpectrum.length,
          0,
          2 * Math.PI,
          false
        );
        this.ctx.fillStyle = colorSpectrum[i].toString(); //A(1-(.05*i));
        this.ctx.fill();
      }
  
      // overlay
      const grd = this.ctx.createRadialGradient(
        pos.x - colorDelta.x,
        pos.y - colorDelta.y,
        0,
        pos.x - colorDelta.x,
        pos.y - colorDelta.y,
        radius
      );
      grd.addColorStop(
        0,
        colorSpectrum[colorSpectrum.length - 1].toStringA(
          BODY.COLOR.OVERLAY_OPACITY_INSIDE
        )
      );
      grd.addColorStop(
        1,
        colorSpectrum[colorSpectrum.length - 1].toStringA(
          BODY.COLOR.OVERLAY_OPACITY_OUTSIDE
        )
      );
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = grd;
      this.ctx.fill();
    }
  
    drawTrail() {
      const { radius, colorSpectrum } = this.prop;
      const { x, y } = this.state.pos;
      const grd = this.ctx.createLinearGradient(x, y - radius, x, y + radius);
      grd.addColorStop(0, colorSpectrum[0].toStringA(BODY.TRAIL.OPACITY_OUTSIDE));
      grd.addColorStop(
        BODY.TRAIL.COLOR_STOP,
        colorSpectrum[0].toStringA(BODY.TRAIL.OPACITY_INSIDE)
      );
      grd.addColorStop(
        1 - BODY.TRAIL.COLOR_STOP,
        colorSpectrum[0].toStringA(BODY.TRAIL.OPACITY_INSIDE)
      );
      grd.addColorStop(1, colorSpectrum[0].toStringA(BODY.TRAIL.OPACITY_OUTSIDE));
      this.ctx.beginPath();
      this.ctx.rect(x, y - radius, this.canvas.W * 2, 2 * radius);
      this.ctx.fillStyle = grd;
      this.ctx.fill();
    }
  }
  
  // PLANET ---------------------------------------------------------------------------------------------
  
  const PLANET = {
    RADIUS: { min: 0.36, max: 0.42 }, // proportional to space 0.2, 0.3
    COLORS: 5,
    OFFSET: {
      SPEED: 0.1,
      MAX_RADIUS: 40,
    },
    SCROLL_SHIFT_RATE: 6,
    RING: {
      GAP: 30,
      COUNT: { min: 14, max: 24 },
      START_ANGLE: { min: Math.PI / 6, max: 5 * Math.PI / 6},
      RATE: Math.PI / 1000
    }
  };
  
  class Planet extends Body {
    constructor(space, layer, id) {
      super(space, layer, id);
      this.drawRing = this.drawRing.bind(this);
    }
  
    setup() {
      const color = new Color().setOpacity(0.9); // random color TODO: use a pallet
      const toColor = new Color().setOpacity(0.9);
  
      // unchanging props
      this.prop = {
        center: { x: this.canvas.W / 2, y: this.canvas.H / 2 }, // planet is in the center
        radius: Random.prop2(PLANET.RADIUS, this.canvas.H),
        colorSpectrum: color.makeSpectrum(toColor, PLANET.COLORS),
        offsetRadiusMax: PLANET.OFFSET.MAX_RADIUS,
        offsetSpeed: PLANET.OFFSET.SPEED,
        scrollShiftRate: PLANET.SCROLL_SHIFT_RATE
      };
      Random.insertRandom(this.prop.colorSpectrum, new Color());
      this.setupColors();
      this.setupRing();
    }
  
    setupRing() {
      this.prop.ringAngleCenter = Random.prop(PLANET.RING.START_ANGLE);
      this.prop.rings = [];
      const ringCount = Random.prop(PLANET.RING.COUNT);
      const color = new Color();
      const toColor = new Color();
      const ringSpectrum = color.makeSpectrum(toColor, ringCount);
      const ringGap = Random.int(6,12);
      for(let i = 0; i < ringSpectrum.length; ++i){
        this.prop.rings.push({
          color: ringSpectrum[i],
          offsetY: i * ringGap + PLANET.RING.GAP,
          lineWidth: 1
        });
      }
  
      this.state.ringAngle = this.prop.ringAngleCenter;
      this.state.ringAngleInc = 0;
    }
  
    move() {
      const mouseShift = this.getMouseShiftedCenter();
      const scrollShift = this.getScrollShiftedCenter();
      this.moveBody({
        x: mouseShift.x + scrollShift.x,
        y: mouseShift.y + scrollShift.y,
      });
      this.moveColors();
      this.moveRing()
    }
  
  
    moveRing() {
      // wiggle the ring angle back and forth a little bit
      // set the ring angle based on the scroll and wiggling
      const { scrollPercent } = this.canvas;
      const scrollOffsetAngle = - Math.PI / 6 * scrollPercent;
      this.state.ringAngleInc += PLANET.RING.RATE;
      const wiggleAngle = Math.sin(this.state.ringAngleInc) * 0.2
      this.state.ringAngle = wiggleAngle + scrollOffsetAngle + this.prop.ringAngleCenter;
    }
  
    draw() {
      this.drawTrail();
      this.drawSpectrum();
      this.drawRing();
    }
  
    drawRing() {
      const { scrollPercent } = this.canvas;
      const { radius } = this.prop;
      const { x, y } = this.state.pos;
      const angle = this.state.ringAngle;
  
      // TODO: we also need to move the x,y radius to pass over the planet
      // if x is less than zero and then reset x to be abs(x) before we draw
      // to get it to flip to the other side we would draw intersection[2 and 3]?
      
      this.prop.rings.forEach((ring, i) => {
        const offset = { // TODO: offset should be calculated based on circle in z direction?
          x: radius/2 - 120*scrollPercent + i, // TODO: make linear equation for this
          // dx: use a multiplier on the x diff to make them the same at 0 and further apart at the peaks
          y: radius + ring.offsetY
        };
        const intersection = ellipseCircleIntersection({
          eRadx: offset.x,
          eRady: offset.y,
          cRad: radius
        });
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, offset.x, offset.y, angle, intersection[0].theta, intersection[1].theta)
        this.ctx.strokeStyle = ring.color.toStringA(0.8);
        this.ctx.lineWidth = ring.lineWidth;
        this.ctx.stroke();
      });
    }
  }
  
  // MOON ---------------------------------------------------------------------------------------------
  
  const MOON = {
    RADIUS: { min: 0.02, max: 0.06 },
    COLORS: 3,
    OFFSET: {
      SPEED: 0.1,
      MAX_RADIUS: 40,
    },
    CENTER: {
      x: { min: -0.25, max: 1 },
      y: { min: 0.001, max: 0.999 }
    },
    SCROLL_SHIFT_RATE: 14
  };
  
  class Moon extends Body {
    constructor(space, layer, id) {
      super(space, layer, id);
    }
  
    setup() {
      const { shorterSide, W, H } = this.canvas;
      const color = new Color().setOpacity(0.9);
      const toColor = new Color().setOpacity(0.9);
  
      // unchanging props
      const radius = Random.prop2(MOON.RADIUS, shorterSide);
      const minX =
        (this.layer > 5) ? SHIP.CENTER.x * this.canvas.H + radius * 3 : MOON.CENTER.x.min * W;
      this.prop = {
        center: {
          x: Random.int(minX, W - radius * 2),
          y: Random.int(0, H),
        },
        radius,
        colorSpectrum: color.makeSpectrum(toColor, MOON.COLORS),
        offsetRadiusMax: MOON.OFFSET.MAX_RADIUS,
        offsetSpeed: MOON.OFFSET.SPEED,
        scrollShiftRate: MOON.SCROLL_SHIFT_RATE
      };
      const randomStripeColor = new Color().setOpacity(0.7);
      Random.insertRandom(this.prop.colorSpectrum, randomStripeColor);
      this.setupColors();
    }
  
    move() {
      const mouseShift = this.getMouseShiftedCenter();
      const scrollShift = this.getScrollShiftedCenter();
      this.moveBody({
        x: mouseShift.x + scrollShift.x,
        y: mouseShift.y + scrollShift.y,
      });
      this.moveColors();
    }
  
    draw() {
      this.drawTrail();
      this.drawSpectrum();
    }
  }
  
  
  // STAR ---------------------------------------------------------------------------------------------
  
  const STAR = {
    RADIUS: { min: 0.0008, max: 0.002 },
    OFFSET: {
      SPEED: 0.1,
      MAX_RADIUS: 20,
    },
    CENTER: {
      x: { min: -0.5, max: 1 },
      y: { min: 0.001, max: 0.999 }
    },
    SCROLL_SHIFT_RATE: 21
  };
  
  class Star extends Body {
    constructor(space, layer, id) {
      super(space, layer, id);
    }
  
    setup() {
      // unchanging props
      this.prop = {
        center: {
          x: Random.prop2(STAR.CENTER.x, this.canvas.W),
          y: Random.prop2(STAR.CENTER.y, this.canvas.H),
        }, // planet is in the center
        radius: Random.prop2(STAR.RADIUS, this.canvas.H),
        color: new Color(),
        offsetRadiusMax: STAR.OFFSET.MAX_RADIUS,
        offsetSpeed: STAR.OFFSET.SPEED,
        scrollShiftRate: STAR.SCROLL_SHIFT_RATE
      };
    }
  
    move() {
      const mouseShift = this.getMouseShiftedCenter();
      const scrollShift = this.getScrollShiftedCenter();
      this.moveBody({
        x: mouseShift.x + scrollShift.x,
        y: mouseShift.y + scrollShift.y,
      });
    }
  
    draw() {
      const { radius, color } = this.prop;
      const { pos } = this.state;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = color.toString();
      this.ctx.fill();
    }
  }
  
  // SHIP ---------------------------------------------------------------------------------------------
  
  const SHIP = {
    CENTER: {
      x: 1 / 6, // proportional to space
      y: 0.5,
    },
    OFFSET: {
      MAX_RADIUS: 80,
      SPEED: 0.3,
    },
    COLORS: {
      EXHAUST_EDGE: "#F00c",
      EXHAUST_MIDDLE: "#F008",
      EXHAUST_PORT: "#555",
      FINS: "#777",
      WINDOWS: "#222",
      BODY: "#EEE",
      SHADOW: "#0004",
    },
    BACKPEDAL: 0.08, // proportion scroll percent
    EXHAUST_LENGTH: 0.2
  };
  
  class Ship extends Body {
    constructor(space, layer, id) {
      super(space, layer, id);
    }
  
    setup() {
      const { W, H } = this.canvas;
      this.prop = {
        center: {
          x: W * SHIP.CENTER.x,
          y: H * SHIP.CENTER.y,
        }, // planet is in the center
        offsetRadiusMax: SHIP.OFFSET.MAX_RADIUS,
        offsetSpeed: SHIP.OFFSET.SPEED,
        exhaustLength: SHIP.EXHAUST_LENGTH * W
      };
      // this.formula = {
      //   exhaustEnd: new QuadraticFormula(
      //     {x: 0, y:0 },
      //     {x: SHIP.BACKPEDAL, y: -500 }
      //   )
      // }
    }
  
    move() {
      const mouseShift = this.getMouseShiftedCenter();
      const scrollShift = this.getShipScrollShiftedCenter();
      this.moveBody({
        x: mouseShift.x + scrollShift.x,
        y: mouseShift.y + scrollShift.y,
      });
    }
  
    getShipScrollShiftedCenter() {
      const { scrollPercent, W, H } = this.canvas;
      return {
        x: Math.pow(scrollPercent - SHIP.BACKPEDAL, 2) * -SHIP.CENTER.x * W * 4,
        y: scrollPercent * -200, // Math.pow(scrollPercent - SHIP.BACKPEDAL, 2) * -SHIP.CENTER.y * H
      };
    }
  
    draw() {
      this.drawExhaust();
      this.drawShip();
    }
  
    drawExhaust() {
      const { pos } = this.state;
      const { scrollPercent, W, H } = this.canvas;
      const { exhaustLength } = this.prop;
  
      const lineLenX = -exhaustLength * (scrollPercent - SHIP.BACKPEDAL) + exhaustLength;
      const inverseLenX = 2 * (exhaustLength - lineLenX);
      // const exhaustEnd = this.formula.exhaustEnd.calc(scrollPercent)
      const exhaustEnd = Math.pow(scrollPercent, 2) * exhaustLength;
      const width = 5; // (scrollPercent > 0.9) ? (scrollPercent - 0.9) * H / 2 + 5 : 5
      const quadraticPointWidth = 5; // this can only be changed once the lineLen is 0
      // const quadraticPointWidth = (scrollPercent > 0.6) ? (H / 2) * (scrollPercent - 0.6) + width : width;
  
      const grd = this.ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, SHIP.COLORS.EXHAUST_EDGE);
      grd.addColorStop(0.5, SHIP.COLORS.EXHAUST_MIDDLE);
      grd.addColorStop(1, SHIP.COLORS.EXHAUST_EDGE);
  
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y - width);
      this.ctx.lineTo(pos.x + lineLenX, pos.y - width);
      this.ctx.quadraticCurveTo(W - inverseLenX, pos.y - quadraticPointWidth, W - exhaustEnd, 0);
      this.ctx.lineTo(2 * W, 0);
      this.ctx.lineTo(2 * W, H);
      this.ctx.lineTo(W - exhaustEnd, H);
      this.ctx.quadraticCurveTo(
        W - inverseLenX,
        pos.y + quadraticPointWidth,
        pos.x + lineLenX,
        pos.y + width
      );
      this.ctx.lineTo(pos.x, pos.y + width);
      this.ctx.fillStyle = grd;
      this.ctx.fill();
    }
  
    drawShip() {
      const { x, y } = this.state.pos;
      // exhaust port
      this.ctx.beginPath();
      this.ctx.moveTo(x + 35, y - 10);
      this.ctx.lineTo(x + 45, y - 5);
      this.ctx.lineTo(x + 45, y + 5);
      this.ctx.lineTo(x + 35, y + 10);
      this.ctx.fillStyle = SHIP.COLORS.EXHAUST_PORT;
      this.ctx.fill();
  
      // body
      this.ctx.beginPath();
      this.ctx.moveTo(x + 35, y - 10);
      this.ctx.quadraticCurveTo(x + 20, y - 30, x - 50, y);
      this.ctx.quadraticCurveTo(x + 20, y + 30, x + 35, y + 10);
      this.ctx.fillStyle = SHIP.COLORS.BODY;
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x - 50, y);
      this.ctx.quadraticCurveTo(x + 20, y + 30, x + 35, y + 10);
      this.ctx.lineTo(x + 35, y - 10);
      this.ctx.quadraticCurveTo(x + 20, y + 24, x - 50, y);
      this.ctx.fillStyle = SHIP.COLORS.SHADOW;
      this.ctx.fill();
  
      // 3 windows
      for (let i = 0; i < 3; ++i) {
        this.ctx.beginPath();
        this.ctx.arc(x - 18 + i * 14, y, 4, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = SHIP.COLORS.WINDOWS;
        this.ctx.fill();
      }
  
      // fins
      this.ctx.beginPath();
      this.ctx.moveTo(x + 6, y - 14);
      this.ctx.lineTo(x + 30, y - 28);
      this.ctx.lineTo(x + 72, y - 30);
      this.ctx.lineTo(x + 34, y - 22);
      this.ctx.lineTo(x + 26, y - 10);
      this.ctx.quadraticCurveTo(x + 18, y - 14, x + 6, y - 14);
      this.ctx.fillStyle = SHIP.COLORS.FINS;
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + 6, y + 14);
      this.ctx.lineTo(x + 30, y + 28);
      this.ctx.lineTo(x + 72, y + 30);
      this.ctx.lineTo(x + 34, y + 22);
      this.ctx.lineTo(x + 26, y + 10);
      this.ctx.quadraticCurveTo(x + 18, y + 14, x + 6, y + 14);
      this.ctx.fillStyle = SHIP.COLORS.FINS;
      this.ctx.fill();
    }
  }