// https://www.w3schools.com/colors/colors_groups.asp
const colors = [
  'deepskyblue',
  'darkorchid',
  'limegreen',
  'darkorange',
  'deeppink',
  'blue',
  'red',
  'forestgreen',
  'indigo',
  'magenta',
  'mediumaquamarine',
  'teal',
  'cornflowerblue',
  'brown',
  'olivedrab',
  'orange',
];

export function randomColor(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

let colorNum = 0;

export function nextColor(): string {
  const color = colors[colorNum];
  colorNum = (colorNum + 1) % colors.length;
  return color;
}
