export interface UnitDef {
  id: string;
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitCategoryDef {
  id: string;
  label: string;
  units: UnitDef[];
}

function linear(id: string, label: string, factor: number): UnitDef {
  return {
    id,
    label,
    toBase: (v) => v * factor,
    fromBase: (v) => v / factor,
  };
}

export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    id: 'length',
    label: 'Length',
    units: [
      linear('mm', 'Millimeters', 0.001),
      linear('cm', 'Centimeters', 0.01),
      linear('m', 'Meters', 1),
      linear('km', 'Kilometers', 1000),
      linear('in', 'Inches', 0.0254),
      linear('ft', 'Feet', 0.3048),
      linear('yd', 'Yards', 0.9144),
      linear('mi', 'Miles', 1609.344),
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    units: [
      linear('mg', 'Milligrams', 0.000001),
      linear('g', 'Grams', 0.001),
      linear('kg', 'Kilograms', 1),
      linear('t', 'Metric Tons', 1000),
      linear('oz', 'Ounces', 0.0283495),
      linear('lb', 'Pounds', 0.453592),
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    units: [
      {
        id: 'c',
        label: 'Celsius',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: 'f',
        label: 'Fahrenheit',
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: 'k',
        label: 'Kelvin',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      linear('ml', 'Milliliters', 0.001),
      linear('l', 'Liters', 1),
      linear('m3', 'Cubic Meters', 1000),
      linear('gal', 'Gallons (US)', 3.78541),
      linear('qt', 'Quarts', 0.946353),
      linear('pt', 'Pints', 0.473176),
      linear('cup', 'Cups', 0.24),
      linear('floz', 'Fluid Ounces', 0.0295735),
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    units: [
      linear('ms', 'Meters/sec', 1),
      linear('kmh', 'km/h', 0.277778),
      linear('mph', 'mph', 0.44704),
      linear('knot', 'Knots', 0.514444),
      linear('fts', 'Feet/sec', 0.3048),
    ],
  },
  {
    id: 'area',
    label: 'Area',
    units: [
      linear('mm2', 'mm²', 0.000001),
      linear('cm2', 'cm²', 0.0001),
      linear('m2', 'm²', 1),
      linear('km2', 'km²', 1000000),
      linear('ha', 'Hectares', 10000),
      linear('acre', 'Acres', 4046.86),
      linear('ft2', 'ft²', 0.092903),
      linear('in2', 'in²', 0.00064516),
    ],
  },
  {
    id: 'data',
    label: 'Data',
    units: [
      linear('bit', 'Bits', 0.125),
      linear('byte', 'Bytes', 1),
      linear('kb', 'KB', 1024),
      linear('mb', 'MB', 1024 ** 2),
      linear('gb', 'GB', 1024 ** 3),
      linear('tb', 'TB', 1024 ** 4),
    ],
  },
];

export function convert(category: UnitCategoryDef, fromId: string, toId: string, value: number): number {
  const from = category.units.find((u) => u.id === fromId);
  const to = category.units.find((u) => u.id === toId);
  if (!from || !to) return NaN;
  return to.fromBase(from.toBase(value));
}
