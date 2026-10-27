export const CELL = 72, ORIGIN = [84, 73];

// The same tile boundaries drive both the drawn rails and ball collisions.
function course(name, par, rows, obstacles = [], ponds = []) {
  const tiles = [], walls = [];
  let start, goal;
  const on = (x,y) => y >= 0 && y < rows.length && x >= 0 && x < 6 && rows[y][x] !== '.';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    const px = ORIGIN[0] + x * CELL, py = ORIGIN[1] + y * CELL;
    tiles.push({ x:px, y:py, w:CELL, h:CELL });
    if (ch === 'T') start = [px + CELL/2, py + CELL/2];
    if (ch === 'H') goal = [px + CELL/2, py + CELL/2];
    if (!on(x,y-1)) walls.push({x:px-4,y:py-4,w:CELL+8,h:8});
    if (!on(x,y+1)) walls.push({x:px-4,y:py+CELL-4,w:CELL+8,h:8});
    if (!on(x-1,y)) walls.push({x:px-4,y:py-4,w:8,h:CELL+8});
    if (!on(x+1,y)) walls.push({x:px+CELL-4,y:py-4,w:8,h:CELL+8});
  }));
  const circles = items => items.map(([x,y,r]) => ({x:ORIGIN[0]+(x+.5)*CELL,y:ORIGIN[1]+(y+.5)*CELL,r}));
  if (!start || !goal) throw new Error('Missing tee or cup: ' + name);
  return {name,par,start,goal,tiles,walls,bumpers:circles(obstacles),hazards:circles(ponds)};
}

export const levels = [
  course('The first putt',2,[
    '......','..H#..','..##..','..##..','..##..','..T#..','......']),
  course('Dogleg right',3,[
    '......','.###H.','.####.','.##...','.##...','.T#...','......']),
  course('The horseshoe',3,[
    '......','.####.','.####.','.#..#.','.#..#.','.T..H.','......']),
  course('Off the bank',3,[
    '......','.###H.','.####.','...##.','.####.','.T###.','......']),
  course('Split decision',3,[
    '..#H..','.####.','.##...','.##...','.##...','.##T..','......'],[[1.5,2,18]]),
  course('The chicane',4,[
    '....H.','..###.','..#...','..###.','....#.','.T###.','......']),
  course('Two ways round',3,[
    '..#H..','.####.','.####.','.####.','.####.','..T#..','......'],[[2.5,2.5,36]]),
  course('The inside line',4,[
    '......','.####.','.H###.','...##.','...##.','.T###.','......']),
  course('Three cushions',4,[
    '.H....','.####.','....#.','.####.','.#....','.T....','......']),
  course('Pond side',4,[
    '..#H..','.####.','.####.','.####.','.####.','..T#..','......'],[],[[2.5,2.5,28]]),
  course('The elbow',4,[
    '.H#...','.##...','.####.','.####.','...##.','...T#.','......'],[[2.5,2.5,20]]),
  course('Long way home',4,[
    '.H....','.####.','...##.','.####.','.##...','.T....','......']),
  course('Narrow margins',5,[
    '....H.','.####.','.#....','.####.','....#.','.T###.','......']),
  course('Bumper run',4,[
    '..#H..','.####.','.####.','.####.','.####.','..T#..','......'],[[1.5,1.7,21],[3.5,3.2,21]]),
  course('Water crossing',4,[
    '.##H#.','.####.','..##..','.####.','.####.','.T###.','......'],[],[[2.5,3.5,22]]),
  course('The switchback',5,[
    '.H###.','....#.','..###.','..#...','..###.','.T###.','......']),
  course('Around the island',5,[
    '.####.','.H.##.','.####.','.##...','.####.','.T###.','......'],[[3.5,4.5,20]]),
  course('The final bend',5,[
    '...H#.','.####.','.###..','.####.','...##.','.T###.','......'],[[2.5,1,17]],[[3.5,4,15]])
];
