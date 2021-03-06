interface Point { x: number, y: number }
type MetaData = { text: string }
type BlockData = MetaData & { y: number, height: number }
type Transfer = { amount: number, anchor: 'start' | 'end' } & Point

const margin = { top: 50, right: 10, bottom: 30, left: 10 }
const width = window.innerWidth - margin.left - margin.right
const height = window.innerHeight - margin.top - margin.bottom
const data = []

let globalX = 0
let globalY = 0
const duration = 400
const max = window.innerWidth
const middle = window.innerWidth / 2
const maxEvents = 10
const maxY = 20
const step = 0
const stepY = 2

const chart = d3.select('#chart')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const x = d3.scaleLinear().domain([0, 1]).range([85, max - 100])
const y = d3.scaleLinear().domain([globalY - maxY, globalY]).range([height, 0])
const lineGenerator = d3.line()
  .curve(d3.curveCardinal)

const line = d3.line<Point>()
  .x(d => x(d.x))
  .y(d => y(d.y))
const smoothLine = d3.line<Point>()
  .curve(d3.curveCardinal)
  .x(d => x(d.x))
  .y(d => y(d.y))
const lineArea = d3.area<Point>()
  .x(d => x(d.x))
  .y0(y(0))
  .y1(d => y(d.y))
  .curve(d3.curveCardinal)
const lineGen = d3.line<Point>()
  .x(d => x(d.x))
  .y(d => y(d.y))
  .curve(d3.curveBasis)

const yAxis = (d3 as any).axisLeft().scale(y).tickSizeOuter(0).tickFormat('')
const axisY = chart.append('g').attr('class', 'y axis')
  .attr('transform', 'translate(85,0)').call(yAxis)
const yAxis2 = (d3 as any).axisRight().scale(y)
  .tickSize(15).tickSizeOuter(0).tickFormat('')// We dont use .tickSize(0) because we want the distance away from the axis to remain;
const axisY2 = chart.append('g').attr('class', 'y axis')
  .attr('transform', `translate(${max - 100},0)`).call(yAxis2)

chart.append('g').attr('transform', 'translate(73,-30) scale(0.25)')
  .append('use').attr('xlink:href', '#man')
chart.append('g').attr('transform', `translate(${max - 112},-30),scale(0.25)`)
  .append('use').attr('xlink:href', '#man')

chart.append('text')
  .attr('transform', `translate(${middle},` + height / 2 + ')')
  .attr('text-anchor', 'middle')
  .text('OFF-CHAIN COMMUNICATION')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '8px')
  .attr('fill', 'gray')
  .attr('opacity', 1)
  .transition()
  .duration(3000)
  .ease(d3.easeLinear)
  .attr('opacity', 0.2)
chart.append('text')
  .attr('transform', `translate(${middle},0)`)
  .attr('text-anchor', 'middle')
  .text('CURRENT BLOCK')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '8px')
  .attr('fill', 'gray')
chart.append('text')
  .attr('id', 'blocknumber')
  .attr('transform', `translate(${middle},-10)`)
  .attr('text-anchor', 'middle')
  .text('?')
  .attr('font-family', 'sans-serif')
  .attr('font-size', '20px')
  .attr('fill', 'gray')

let format = d3.format(',d')
function updateCurrentBlock (bn: number) {
  d3.select('#blocknumber')
    .transition()
    .duration(duration)
    .on('start', function repeat (this: any) {
      d3.active(this)!
        .tween('text', function (this: any) {
          const that = d3.select(this) as any
          //  const i = d3.interpolateNumber(that.text().replace(/,/g, ''), Math.random() * 1e6)
          return function (t) { that.text(format(bn)) }
        })
        .transition()

    })
}

const blocks = chart.append('g').attr('id', 'blocks')
const blockData: BlockData[] = []
const arrows = chart.append('g').attr('id', 'arrows')
const arrowData: Point[][] = []
const metaData: MetaData[] = []
const transfers = chart.append('g').attr('id', 'transfers')
const transferData: Transfer[] = []

// draw the block from y height to max-height
function drawBlock (val: BlockData) {
  blockData.push(val)
  let add = blocks.selectAll('.block')
    .data<BlockData>(blockData as any, (d: any) => d.y)
    .enter()
  let block = add.append('g').attr('class', 'block')
  block.append('rect')
    .attr('x', 85)// static
    .attr('y', function (d) {
      return y(d.y)
    })
    .attr('width', max - 200)// static
    .attr('fill', 'url(#lightstripe)')
    .attr('fill-opacity', '0.1')
    .attr('height', function (d) {
      return height / maxY * d.height
    });
  (block as any).append('use').attr('class', 'block-marker')
    .attr('transform', 'scale(0.0225)')
    .attr('xlink:href', '#marker')
    .attr('x', 85 / 0.045)// divide by scale
    .attr('y', function (d) {

      return (y(d.y) + 5) / 0.0225 + 933.3333333333334
    }).transition()
    .duration(duration)
    .ease(d3.easeElastic, 2)
    .attr('x', 85 / 0.0225)

  block.append('text')
    .attr('class', 'block-text')
    .attr('transform', `translate(${middle},` + (y(val.y - val.height / 2)) + ')')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', '10px')
    .attr('fill', 'orange')
    .text(val.text)

}

function next_arrows () {

  (transfers.selectAll('.transfer') as any)
    .data(transferData, d => d.y)
    .exit().remove();
  (transfers.selectAll('.transfer') as any)
    .data(transferData, d => d.y)
    .enter().append('text')
    .attr('class', 'transfer')
    .attr('font-family', 'sans-serif')
    .attr('font-size', '14px')
    .attr('text-anchor', d => d.anchor)
    .attr('transform', (d: any) => `translate(${x(d.x)},${y(d.y)})`)
    .attr('fill', d => d.amount < 0 ? 'red' : 'green')
    // .style('text-anchor', 'middle') // place the text halfway on the arc
    // .attr('startOffset', '50%')
    .attr('opacity', 0)
    .text((d) => `${d.amount < 0 ? '' : '+'}${d.amount}`)
    .transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .attr('opacity', 1);

  (arrows.selectAll('.arrow') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y }).exit().remove();
  (arrows.selectAll('.arrow') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y })
    .enter()
    .append('path')
    .attr('class', 'arrow')
    .attr('d', lineGen)
    .attr('stroke', 'lightgrey')
    .attr('stroke-opacity', 0.5)
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('stroke-dasharray', function (this: any) {
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
    })
    .attr('stroke-dashoffset', function (this: any, d) { return this.getTotalLength() })
    .transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .attr('stroke-dashoffset', 0);

  (arrows.selectAll('.arrow-text-path') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y })
    .exit()
    .remove();
  (arrows.selectAll('.arrow-text-path') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y })
    .enter().append('path')
    .attr('class', 'arrow-text-path')
    .attr('d', d => d[0].x === 0 ? lineGen(d) : lineGen(d.slice().reverse()))
    .attr('id', function (d) { return 'line' + d[0].y })
    .attr('fill', 'none')
    .attr('stroke', 'none');
  (arrows.selectAll('.arrow-text') as any).data(arrowData, function (d) { return d[d.length - 1].y })
    .exit().remove();
  (arrows.selectAll('.arrow-text') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y })
    .enter().append('text')
    .append('textPath') // append a textPath to the text element
    .attr('xlink:href', function (d) { return '#line' + d[0].y }) // place the ID of the path here
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .attr('font-size', '10px')
    .attr('fill', 'grey')
    .style('text-anchor', 'middle') // place the text halfway on the arc
    .attr('startOffset', '50%')
    .attr('opacity', 0)
    .text((_, i) => metaData[i].text)
    .transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .attr('opacity', 1)

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d: any) { return d[d.length - 1].y })
    .exit().remove();

  (arrows.selectAll('.arrow-head') as any)
    .data(arrowData, function (d) { return d[d.length - 1].y })
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
    .ease(d3.easeElastic, 100)
    .attr('r', 5)

}

function tick () {
  globalX += step
  globalY += stepY

  y.domain([globalY - maxY, globalY]);
  (axisY as any).transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .call(yAxis);

  (axisY2 as any).transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .call(yAxis2)

  arrows.selectAll('.arrow')
    .data(arrowData, function (d: any) { return d[d.length - 1].y })
    .attr('d', lineGen)
    .attr('stroke-width', 1)
    .attr('fill', 'none');

  (transfers.selectAll('.transfer') as any)
    .transition().duration(duration).ease(d3.easeLinear, 2)
    .attr('transform', (d: any) => `translate(${x(d.x)},${y(d.y)})`)

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d: any) { return d[d.length - 1].y })
    .attr('class', 'arrow-head')
    .attr('cx', function (d) { return x(d[d.length - 1].x) })
    .attr('cy', function (d) { return y(d[d.length - 1].y) })

  arrows.selectAll('.arrow-text-path')
    .data(arrowData, function (d: any) { return d[d.length - 1].y })
    .attr('d', function (d) {
      if (d[0].x === 0) {
        return lineGen(d)
      } else {
        return lineGen(d.slice().reverse())
      }
    })
  blocks.selectAll('rect').attr('y', (d: any) => y(d.y))

  blocks.selectAll('.block-marker')
    .attr('y', (d) => (y((d as any).y) + 5) / 0.0225 + 933.3333333333334)
  blocks.selectAll('.block-text')
    .attr('transform', (d: any) => `translate(${middle},` + (y(d.y - d.height / 2)) + ')');
  (blocks as any).attr('transform', null).transition().duration(duration).ease(d3.easeLinear, 2)
    .attr('transform', 'translate(0,' + y(globalY - stepY) + ')');
  (arrows as any).attr('transform', null).transition().duration(duration).ease(d3.easeLinear, 2)
    .attr('transform', 'translate(0,' + y(globalY - stepY) + ')')
    .on('end',
      function () {
        // TODO: not sure but seems that we should compare sum of lengths of arrowData and blockData
        if (arrowData.length >= maxEvents) {
          arrowData.splice(0, arrowData.length - maxEvents)
          metaData.splice(0, metaData.length - maxEvents)
        }
        if (blockData.length >= maxEvents) {
          blockData.splice(0, blockData.length - maxEvents)
        }
        if (transferData.length >= maxEvents) {
          transferData.splice(0, transferData.length - maxEvents)
        }
        next_arrows()
      })

}

// RUN
const initBridge = (onEvent: (e: VisEvent) => void) => {
  (window as any)._GN = {
    emitEvent: onEvent
  }
}

initBridge(
  (e: VisEvent) => {
    switch (e.type) {
      case 'init':
      case 'block-number':
        updateCurrentBlock(e.block)
        break
      case 'on-event':
        drawBlock({ y: globalY, height: stepY, text: e.details })
        tick()
        break
      case 'off-msg':
        metaData.push({ text: e.messageType + ': ' + e.message })
        // todo: fix / improve setting transfers x, y
        if (e.dir === 'left->right') {
          if ((e as any).sentAmount) {
            transferData.push({ x: -0.03, y: globalY - stepY * 2 - 0.03, anchor: 'end', amount: (e as any).sentAmount })
          }
          if ((e as any).receivedAmount) {
            transferData.push({  x: 1.03, y: globalY - stepY - 0.03, anchor: 'start', amount: (e as any).receivedAmount })
          }
          arrowData.push([{ x: 0, y: globalY - stepY },
          { x: 0.25, y: globalY - stepY * .125 }, { x: 0.75, y: globalY + stepY * .125 }, { x: 1, y: globalY }])
        } else {
          if ((e as any).sentAmount) {
            transferData.push({ x: 1.03, y: globalY - 2 * stepY - 0.03, anchor: 'start', amount: (e as any).sentAmount })
          }
          if ((e as any).receivedAmount) {
            transferData.push({ x: -0.03, y: globalY - stepY - 0.03, anchor: 'end', amount: (e as any).receivedAmount })
          }
          arrowData.push([{ x: 1, y: globalY - stepY },
          { x: 0.75, y: globalY - stepY * .125 }, { x: 0.25, y: globalY + stepY * .125 }, { x: 0, y: globalY }])
        }
        tick()
        break
    }
  })
