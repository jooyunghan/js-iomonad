const {readLine, printLine, run} = require('./io')
const {Free} = require('./free')

// [m a] -> m [a]
function sequence(as, m) {
  if (as.length == 0) {
    return m.pure([])
  } else {
    return as[0].flatMap(a => sequence(as.slice(1), m).map(as => [a].concat(as)))
  }
}

function replicate(n, a) {
  return [... Array(n)].map(() => a)
}

Array.prototype.flatMap = function (f) {
  return [].concat(...this.map(f))
}

Array.prototype.unique = function () {
  var result = [];
  for (let e of this) {
    if (result.indexOf(e) == -1) {
      result.push(e)
    }
  }
  return result;
}

Array.prototype.sorted = function () {
  var result = [...this]
  result.sort((a,b) => (a < b) ? -1 : (a === b) ? 0 : 1 )
  return result;
}

function findTags(html) {
  var exp = /<\s*(\w+)(\s+[^>]*)?>(.*)<\/\s*\1>|<\s*(\w+)(\s+[^>]*)?\/\s*>/;
  var match;
  var result = [];
  while ((match = exp.exec(html)) !== null) {
    result.push(match[1] || match[4])
    html = match[3]
  }
  return result
}

var program = readLine().map(line => parseInt(line))
  .flatMap(n => sequence(replicate(n, readLine()), Free))
  .map(lines => lines.flatMap(findTags).unique())
  .flatMap(tags => printLine(tags.sorted().join(";")))

function forever(a) {
  return a.flatMap(() => forever(a))
}

function print(a) {
  return printLine(a).flatMap(() => print(a))
}

var program2 = forever(printLine(3))

function echo() {
  return readLine()
    .flatMap(line => printLine('>>>' + line))
    .flatMap(() => echo())
}

run(program2, a => process.exit(0))

