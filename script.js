// RANDOM --------------------------------------------------------------------------------------------

const Random = {
  int: (min, max) => Math.round(Math.random() * (max - min)) + min,
  dec: (min, max) => Math.random() * (max - min) + min,
  bool: () => Math.random() > 0.5,
};

Random.prop = ({ min, max }) => {
  if (min % 1 === 0 && max % 1 === 0) {
    return Random.int(min, max);
  }
  return Random.dec(min, max);
};

Random.prop2 = ({ min, max }, comp) => Random.prop({ min, max }) * comp;

Random.shuffle = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array;
}

Random.insertRandom = (array, value) => {
  array.splice(Random.int(0,array.length), 0, value);
}

// COLOR --------------------------------------------------------------------------------------------

class Color {
  constructor(color) {
    if (!!color) {
      const { r, g, b, a } = color;
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    } else {
      this.random();
    }
  }

  random() {
    this.r = Random.int(0, 255);
    this.g = Random.int(0, 255);
    this.b = Random.int(0, 255);
    this.a = Random.dec(0, 1);
  }

  randomSimilar(distance) {
    const d1 = Random.dec(-1,1) * distance;
    const d2 = Random.dec(-1,1) * (distance - d1);
    const d3 = distance - (d1 + d2);
    const [ dr, dg, db ] = Random.shuffle([d1,d2,d3]);
    return new Color({
      r: this.r + dr,
      g: this.g + dg,
      b: this.b + db,
      a: this.a
    })
  }

  setOpacity(a) {
    this.a = a;
    return this;
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  toStringA(a) {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${a})`;
  }

  averageColor(c2) {
    return new Color({
      r: (this.r + c2.r) / 2,
      g: (this.g + c2.g) / 2,
      b: (this.b + c2.b) / 2,
      a: (this.a + c2.a) / 2,
    });
  }

  makeSpectrum(c2, colorCount) {
    const colors = [this];
    const delta = {
      r: c2.r - this.r,
      g: c2.g - this.g,
      b: c2.b - this.b,
      a: c2.a - this.a,
    };
    for (let i = 1; i <= colorCount; ++i) {
      colors.push(
        new Color({
          r: this.r + (delta.r * i) / colorCount,
          g: this.g + (delta.g * i) / colorCount,
          b: this.b + (delta.b * i) / colorCount,
          a: this.a + (delta.a * i) / colorCount,
        })
      );
    }
    return colors;
  }
}

// MATH --------------------------------------------------------------------------------------------


const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));


// TODO: use these
class LinearFormula {
  constructor(min, max) {
    this.m = (max.y - min.y) / (max.x - min.x);
    this.b = min.y - (slope * min.x);
  }

  calc(x) {
    return this.m * x + this.b;
  }
}

class QuadraticFormula {
  constructor(point, vertex) {
    this.vertex = vertex;
    this.a = point.y - vertex.y / Math.pow(point.x-vertex.x, 2)
  }

  calc(x) {
    const { a, vertex } = this;
    return a * Math.pow((x-vertex.x), 2) + vertex.y;
  }
}

const ellipseCircleIntersection = ({ eRadx, eRady, cRad }) => {
  // https://www.analyzemath.com/EllipseProblems/ellipse_intersection.html
  const num = (eRadx * eRadx) - (cRad * cRad);
  const denom = ((eRadx * eRadx) / (eRady * eRady)) - 1;
  const y = Math.sqrt(num/denom);
  const x = Math.sqrt(cRad * cRad - y * y);
  const values = [
    { x, y, phi: Math.atan2(y , x) },
    { x: -x, y, phi: Math.atan2(y , -x) },
    { x, y: -y, phi: Math.atan2(-y , x) },
    { x: -x, y: -y, phi: Math.atan2(-y , -x) }
  ];
  // https://www.petercollingridge.co.uk/tutorials/computational-geometry/finding-angle-around-ellipse/
  values.forEach(v => {
    v.theta = Math.atan(eRadx/eRady * Math.tan(v.phi))
  });
  return values;
}