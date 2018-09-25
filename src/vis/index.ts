const log = (t: string) => document.body.insertAdjacentHTML('beforeend', `<div>${t}</div>`)

const deps = [
  ['dispatch', 'collection', 'array', 'timer', 'interpolate', 'path', 'color', 'ease'], // deps of direct
  ['shape', 'selection', 'format', 'axis', 'scale'], // direct deps
  ['time-format', 'transition'] // mixed
]

const logDeps = () => deps.forEach(l => l.forEach(d => log(d + '? ' + !!(window as any).d3[d])))

logDeps()

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
// .attr('width', width)
// .attr('height', height);
let x = d3.scaleLinear().domain([0, 2]).range([200, 600])
let y = d3.scaleLinear().domain([globalY - maxY, globalY]).range([height, 0])
log('LINE-GEN-BEFORE')
let lineGenerator = d3.line()
  .curve(d3.curveCardinal)
// -----------------------------------
let line = d3.line()
  .x(function (d) { return x(d.x) })
  .y(function (d) { return y(d.y) })
let smoothLine = d3.line().curve(d3.curveCardinal)
  .x(function (d) { return x(d.x) })
  .y(function (d) { return y(d.y) })
let lineArea = d3.area()
  .x(function (d) { return x(d.x) })
  .y0(y(0))
  .y1(function (d) { return y(d.y) })
  .curve(d3.curveCardinal)
log('LINE-GEN-AFTER')
// -----------------------------------

// Draw the axis
//    var xAxis = d3.axisBottom().scale(x);
//    var axisX = chart.append('g').attr('class', 'x axis')
// 		     .attr('transform', 'translate(0, 500)')
// 		     .call(xAxis);
// var xAxis2 = d3.axisTop().scale(x);
//    var axisX2 = chart.append('g').attr('class', 'x axis')
// 		     .attr('transform', 'translate(0,200)')
// 		     .call(xAxis2);
let yAxis = (d3 as any).axisLeft().scale(y).tickSizeOuter(0).tickFormat('')
let axisY = chart.append('g').attr('class', 'y axis')
  .attr('transform', 'translate(200,0)').call(yAxis)
let yAxis2 = (d3 as any).axisRight().scale(y).tickSize(15).tickSizeOuter(0).tickFormat('') // We dont use .tickSize(0) because we want the distance away from the axis to remain;
let axisY2 = chart.append('g').attr('class', 'y axis')
  .attr('transform', 'translate(400,0)').call(yAxis2)
// var yAxis3 = d3.axisRight().scale(y).tickSize(15).tickSizeOuter(0);// We dont use .tickSize(0) because we want the distance away from the axis to remain;
// var axisY3 = chart.append("g").attr('class', 'y axis')
// .attr("transform", "translate(600,0)").call(yAxis3);

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

log('FORMAT-BEFORE d3.format?' + !!d3.format)
// let format = d3.format(',d')
log('FORMAT-AFTER')
let bn = 1
function updateCurrentBlock () {
  log('UPDATE')
  logDeps()
  d3.select('#blocknumber')
    .attr('text', bn++)
  // .transition()
  // .duration(duration)
  // .on('start', function repeat (this: any) {
  //   log('ACTIVE?': d3.active(this) + '')
  //   d3.active(this)
  //     .tween('text', function (this: any) {
  //       let that = d3.select(this)
  //       let i = d3.interpolateNumber(that.text().replace(/,/g, ''), Math.random() * 1e6)
  //       return function (t) { that.text(format(i(t))) }
  //     })
  //     .transition()

  // })
}
setInterval(updateCurrentBlock, 5000)
let lineGen = d3.line()
  .x(function (d) {
    // console.log(x(d.x))
    return x(d.x)
  })
  .y(function (d) {
    // console.log(y(d.y))
    return y(d.y)
  }).curve(d3.curveBasis)// curve(d3.curveCatmullRom.alpha(0.5));;

let arrows = chart.append('g').attr('id', 'arrows')
let arrowData: any = []

// var arrow_data = [[{x:0,y:globalY}, {x:0.5, y:globalY+stepY*0.5},{x:1.5, y:globalY+stepY*0.5}, {x:2, y:globalY}]];

//   arrows.selectAll(".arrow")
//   .data(arrow_data,function(d) { return d[0].y})
//   .enter()
//   .append("path")
//   .attr("class", "arrow")
//   .attr("d", lineGen)
//   .attr('stroke', 'lightgrey')
//   .attr('stroke-opacity', 0.5)
// 			.attr('stroke-width', 2)
// 			.attr('fill', 'none')
// 			.attr("stroke-dasharray", function(d){ return this.getTotalLength() })
//           .attr("stroke-dashoffset", function(d){ return this.getTotalLength() });

// // var arrow = chart.append('path').data(arrow_data
// // 	 	)
// // 			.attr('d', lineGen)
// // 			.attr('stroke', 'green')
// // 			.attr('stroke-width', 2)
// // 			.attr('fill', 'none')
// // 			.attr("stroke-dasharray", function(d){ return this.getTotalLength() })
// //           .attr("stroke-dashoffset", function(d){ return this.getTotalLength() });

// 			arrows.selectAll("path")
//     .transition()
//       .duration(duration)
//       .ease(d3.easeLinear,2)
//       .attr("stroke-dashoffset", 0).on("end",tick)
log('TICK-BEFORE')
tick()
function next_arrows () {
  if (Math.random() > 0.5) {
    arrowData.push([{ x: 0, y: globalY - stepY }, { x: 0.25, y: globalY - stepY * .125 }, { x: 0.75, y: globalY + stepY * .125 }, { x: 1, y: globalY }])
  } else {
    arrowData.push([{ x: 1, y: globalY - stepY }, { x: 0.75, y: globalY - stepY * .125 }, { x: 0.25, y: globalY + stepY * .125 }, { x: 0, y: globalY }])
  }
  // console.log('running enter')
  arrows.selectAll('.arrow')
    .data(arrowData, function (d) { return d[d.length - 1].y }).exit().remove()
  arrows.selectAll('.arrow')
    .data(arrowData, function (d) { return d[d.length - 1].y })
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
    .ease(d3.easeLinear, 2)
    .attr('stroke-dashoffset', 0)
    .on('end', tick)

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d) { return d[d.length - 1].y }).exit().remove()

  arrows.selectAll('.arrow-head')
    .data(arrowData, function (d) { return d[d.length - 1].y })
    .enter()

    .append('circle')
    .attr('class', 'arrow-head arrow-head-start')
    .attr('cx', function (d) { return x(d[d.length - 1].x) })
    .attr('cy', function (d) { return y(d[d.length - 1].y) })
    .attr('stroke', 'none')
    .attr('fill', '#FF6B6B')
    // .attr('fill-opacity',0.75)
    .attr('r', 0)
    .transition()
    .duration(duration)
    .delay(duration)
    .ease(d3.easeElastic, 100)
    .attr('r', 5)
  // .on("end", tick);
  // .transition()
  // ,duration(duration)
  //
  // attr("r", 5);

}
// .on("end",tick);
// Main loop
function tick (this: any) {

  let point = {
    x: 0,
    y: (globalY + stepY)
  }
  // data.push(point);
  globalX += step
  globalY += stepY

  let d = y.domain()
  y.domain([globalY - maxY, globalY])
  axisY.transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .call(yAxis)
  // .on('end',tick);
  axisY2.transition()
    .duration(duration)
    .ease(d3.easeLinear, 2)
    .call(yAxis2)
  // axisY3.transition()
  // .duration(duration)
  // .ease(d3.easeLinear,2)
  // .call(yAxis3)

  arrows.selectAll('.arrow')
    .data(arrowData, function (d) { return d[d.length - 1].y })
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
    .attr('stroke-dashoffset', function (d) { return 0 })
  arrows.selectAll('.arrow-head')

    .data(arrowData, function (d) { return d[d.length - 1].y })
    .attr('class', 'arrow-head')
    .attr('cx', function (d) { return x(d[d.length - 1].x) })
    .attr('cy', function (d) { return y(d[d.length - 1].y) })
  // bcevents.selectAll(".bcevent")
  // 	 .data(bcevent_data,function(d) {

  //   	return d[0].y})
  // 	 .attr("class", "bcevent")
  //    .attr("cx",function(d){ return x(d[0].x)})
  //   .attr("cy",function(d){ return y(d[0].y)})
  //   .attr("r",0)
  //   .attr('stroke', '#5DD39E')
  //  	.attr('fill',"transparent")

  arrows.attr('transform', null).transition().duration(duration).ease(d3.easeLinear, 2)
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
// function onBlockchainEvent () {

//   bcevent_data.push([{ x: Math.floor(Math.random() * 2), y: globalY }])
//   bcevents.selectAll('.bcevent')
//     .data(bcevent_data, function (d) {

//       return d[0].y
//     })
//     .enter()

//     .append('circle')
//     .attr('class', 'bcevent')
//     .attr('cx', function (d) { return x(d[0].x) })
//     .attr('cy', function (d) { return y(d[0].y) })
//     .attr('r', 0)
//     .attr('stroke', '#5DD39E')
//     .attr('fill', 'transparent')
//     .transition()
//     .duration(duration)
//     .ease(d3.easeElastic, 2)
//     .attr('r', 5).on('end', tick)
//   if (bcevent_data.length > maxEvents) { bcevent_data.shift() }
// }
