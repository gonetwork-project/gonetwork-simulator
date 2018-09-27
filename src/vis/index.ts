interface Point { x: number, y: number }

let margin = { top: 50, right: 10, bottom: 30, left: 10 }
let width = 600 - margin.left - margin.right
let height = 500 - margin.top - margin.bottom
let data = []

let globalX = 0
let globalY = 0
let duration = 1000
let max = 600
let maxEvents = 100
let maxY = 20
let step = 0
let stepY = 1
let chart = d3.select('#chart')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

let x = d3.scaleLinear().domain([0, 2]).range([200, 600])
let y = d3.scaleLinear().domain([globalY - maxY, globalY]).range([height, 0])

let lineGenerator = d3.line()
  .curve(d3.curveCardinal)

let line = d3.line<Point>()
  .x(d => x(d.x))
  .y(d => y(d.y))
let smoothLine = d3.line<Point>()
  .curve(d3.curveCardinal)
  .x(d => x(d.x))
  .y(d => y(d.y))
let lineArea = d3.area<Point>()
  .x(d => x(d.x))
  .y0(y(0))
  .y1(d => y(d.y))
  .curve(d3.curveCardinal)

let yAxis = (d3 as any).axisLeft().scale(y).tickSizeOuter(0).tickFormat('')
let axisY = chart.append('g').attr('class', 'y axis')
  .attr('transform', 'translate(200,0)').call(yAxis)
let yAxis2 = (d3 as any).axisRight().scale(y).tickSize(15).tickSizeOuter(0).tickFormat('') // We dont use .tickSize(0) because we want the distance away from the axis to remain;
let axisY2 = chart.append('g').attr('class', 'y axis')
  .attr('transform', 'translate(400,0)').call(yAxis2)

chart.append('g').attr('transform', 'translate(188,-30) scale(0.25)')
  .append('use').attr('xlink:href', '#man')
chart.append('g').attr('transform', 'translate(388,-30),scale(0.25)')
  .append('use').attr('xlink:href', '#man')

chart.append('g').attr('transform', 'translate(388,0) scale(0.0225)')
  .append('use').attr('xlink:href', '#marker')
chart.append('text')
  .attr('transform', 'translate(300,' + height / 2 + ')')
  .attr('text-anchor', 'middle')
  .text('OFF-CHAIN COMMUNICATION')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '10px')
  .attr('fill', 'gray')
chart.append('text')
  .attr('transform', 'translate(300,10)')
  .attr('text-anchor', 'middle')
  .text('CURRENT BLOCK')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '8px')
  .attr('fill', 'gray')
chart.append('text')
  .attr('id', 'blocknumber')
  .attr('transform', 'translate(300,0)')
  .attr('text-anchor', 'middle')
  .text('9000')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '20px')
  .attr('fill', 'gray')

let format = d3.format(',d')

function updateCurrentBlock () {
  d3.select('#blocknumber')
    .transition()
    .duration(duration)
    .on('start', function repeat (this: any) {
      d3.active(this)!
        .tween('text', function (this: any) {
          let that = d3.select(this) as any
          let i = d3.interpolateNumber(that.text().replace(/,/g, ''), Math.random() * 1e6)
          return function (t) { that.text(format(i(t))) }
        })
        .transition()
    })
}

let arrows = chart.append('g').attr('id', 'arrows')
let arrowData: Point[][] = []
let lineGen = d3.line<Point>()
  .x(d => x(d.x))
  .y(d => y(d.y))
  .curve(d3.curveBasis)

function next_arrows () {
  if (Math.random() > 0.5) {
    arrowData.push([{ x: 0, y: globalY - stepY }, { x: 0.25, y: globalY - stepY * .125 }, { x: 0.75, y: globalY + stepY * .125 }, { x: 1, y: globalY }])
  } else {
    arrowData.push([{ x: 1, y: globalY - stepY }, { x: 0.75, y: globalY - stepY * .125 }, { x: 0.25, y: globalY + stepY * .125 }, { x: 0, y: globalY }])
  }

  (arrows.selectAll('.arrow') as d3.Selection<HTMLElement, Point[], any, number>)
    .data<Point[]>(arrowData, function (d: Point[]) { return d[d.length - 1].y } as any).exit().remove();

  (arrows.selectAll('.arrow') as d3.Selection<HTMLElement, Point[], any, number>)
    .data<Point[]>(arrowData, function (d) { return d[d.length - 1].y } as any)
    .enter()
    .append('path')
    .attr('class', 'arrow')
    .attr('d', lineGen)
    .attr('stroke', 'lightgrey')
    .attr('stroke-opacity', 0.5)
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('stroke-dasharray', function (this: any, d) { return this.getTotalLength() })
    .attr('stroke-dashoffset', function (this: any, d) { return this.getTotalLength() })
    .transition()
    .duration(duration)
    .ease(d3.easeLinear /*, 2*/)
    .attr('stroke-dashoffset', 0)
    .on('end', tick)

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d) { return d[d.length - 1].y } as any).exit().remove()

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d) { return d[d.length - 1].y } as any)
    .enter()
    .append('circle')
    .attr('class', 'arrow-head arrow-head-start')
    .attr('cx', function (d) { return x(d[d.length - 1].x) })
    .attr('cy', function (d) { return y(d[d.length - 1].y) })
    .attr('stroke', 'none')
    .attr('fill', '#FF6B6B')
    .attr('r', 0)
    .transition()
    .duration(duration)
    .delay(duration)
    .ease(d3.easeElastic /*, 100*/)
    .attr('r', 5)
}
// .on("end",tick);
// Main loop
function tick (this: any) {

  globalX += step
  globalY += stepY

  y.domain([globalY - maxY, globalY])
  axisY.transition()
    .duration(duration)
    .ease(d3.easeLinear/*, 2*/)
    .call(yAxis)
  // .on('end',tick);
  axisY2.transition()
    .duration(duration)
    .ease(d3.easeLinear/*, 2*/)
    .call(yAxis2)
  // axisY3.transition()
  // .duration(duration)
  // .ease(d3.easeLinear,2)
  // .call(yAxis3)

  arrows.selectAll('.arrow')
    .data(arrowData, function (d) { return d[d.length - 1].y } as any)
    .attr('d', lineGen)

    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('stroke-dasharray', function (this: any, d) {
      // Create a (random) dash pattern
      // The first number specifies the length of the visible part, the dash
      // The second number specifies the length of the invisible part
      let dashing = '6, 6'
      // This returns the length of adding all of the numbers in dashing
      // (the length of one pattern in essence)
      // So for "6,6", for example, that would return 6+6 = 12
      let dashLength =
        dashing
          .split(/[\s,]/)
          .map(function (a) { return parseFloat(a) || 0 })
          .reduce(function (a, b) { return a + b })
      // How many of these dash patterns will fit inside the entire path?
      let dashCount = Math.ceil(this.getTotalLength() / dashLength)
      // Create an array that holds the pattern as often
      // so it will fill the entire path
      let newDashes = new Array(dashCount).join(dashing + ' ')
      // Then add one more dash pattern, namely with a visible part
      // of length 0 (so nothing) and a white part
      // that is the same length as the entire path
      let dashArray = newDashes + ' 0, ' + this.getTotalLength()
      return dashArray
      // this.getTotalLength()
    })
    .attr('stroke-dashoffset', function () { return 0 })
  arrows.selectAll('.arrow-head')

    .data(arrowData, function (d) { return d[d.length - 1].y } as any)
    .attr('class', 'arrow-head')
    .attr('cx', function (d) { return x(d[d.length - 1].x) })
    .attr('cy', function (d) { return y(d[d.length - 1].y) })

  arrows.attr('transform', null).transition().duration(duration).ease(d3.easeLinear/*, 2*/)
    .attr('transform', 'translate(0,' + y(globalY - stepY) + ')').on('end',
      function () {
        let rand = Math.random()
        if (rand > 0.6) {
          if (arrowData.length >= maxEvents) {
            // console.log('removing items')
            arrowData.splice(0, arrowData.length - maxEvents)
          }
          // console.log('running next_arrows')
          next_arrows()
        } else {
          tick()
        }
      })
}

// RUN
const initBridge = (onInit: (e: any) => void, onEvent: (e: any) => void) => {
  (window as any)._GN = {
    emitInit: (e: any) => onInit(e),
    emitEvent: (e: any) => {
      // document.body.insertAdjacentHTML('beforeend', `<div>EVENT ${JSON.stringify(e)}</div>`)
      onEvent(e)
    }
  }
}

initBridge(
  () => {
    document.body.insertAdjacentHTML('beforeend', `<div>INITED</div>`)
    setInterval(updateCurrentBlock, 5000)
    tick()
  },
  (e) => document.body.insertAdjacentHTML('beforeend', `<div>EVENT: ${JSON.stringify(e)}</div>`)
)
