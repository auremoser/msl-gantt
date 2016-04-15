// (function() {
	// Function global to uncomment when push into someone else code, keep my vars mine
	'use strict';
	/*
	 * SET VARS
	 */
	var canvas_width = d3.select('#chart-canvas').node().offsetWidth;

	var teamColorScale = d3.scale.ordinal()
		.domain(['Abby', 'Arliss', 'Aurelia', 'Zannah', 'Steph', 'Kaitlin', 'Team', 'Org'])
		// .range(['#e45f56',' #d75c37','#fff568','#a3d39c','#4aaaa5','#5694e4','#260126', '#5694e4'])
		.range(['#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#abdda4', '#66c2a5', '#3288bd']);

	var priorityScale = d3.scale.linear()
		// .domain([-1, 0, 1])
		.range(['#bfd3e6', '#9ebcda','#8c96c6','#6baed6','#3182bd','#08519c']);


	var xScale = d3.time.scale()
		.rangeRound([125, canvas_width]);


	var data = [], milestones = [];

	var number_of_bars, canvas_height;

	// Compute the height our canvas needs to be once we get the data
	var bar_height = 20;
	var bar_margin_bottom = 10;
	var container_top_padding = 30;
	var container_bottom_padding = 40;
	// Declare color/filter vars
	var color_selector, filter_selector;

	var today = new Date();

	var ganttBarContainer;


	/*
	 * LOAD AND TIDY DATA
	 */
	 // Data comes in as a simple updateable csv, so names entities, values can update
	 // Gspreadsheet for CSV is here: https://docs.google.com/a/ushahidi.com/spreadsheet/ccc?key=0AlR1bR7sxqL-dFhnYWRNUm81WWNUai0ybjZRcWwyNXc&usp=sharing
	 // Moved to https://docs.google.com/spreadsheets/d/1cWVY2Ax9Q7GE1_V6_0dTp6JLCF9t8oj4hoRlWE_RP4M/edit?usp=sharing

	 // Switch to lowercase Y in the d3.time.format if using an excel csv, it's uppercase because google spreadsheets formats it's dates differently
	 // this is porting from gdocs, so I uppercased the Y
	var dateFormat = d3.time.format('%m/%d/%Y');

	function tidyData(csv) {
		
		// Tidy all the data in to the correct types as CSV gives everything as a string
		csv.forEach(function(d, i) {
			if (d['type'] === 'milestone') {
				d.start_date = dateFormat.parse(d.start_date);
				milestones.push(d);

			} else {
				d.id = i;
				d.start_date = dateFormat.parse(d.start_date);
				d.end_date = dateFormat.parse(d.end_date);
				d.priority = parseInt(d.priority);
				data.push(d);
			
			}

		});

		console.log(milestones);
		// TO DO: Totes arbitrary values at this point for "priority", fix that
	 	// Priority is a column field because there's probably some # value we'll want to sort deliverables by
		// Set priority extent and scaling for whatever amount you want to prioritize (resources, counts, downloads, anything numeric)
		var priority_extent = d3.extent(data, function(d) {return d.priority});
		console.log(priority_extent);
		priorityScale.domain([-2, 2]);

		// Find min/max of our dates
		var min = d3.min(data, function(d) { return d.start_date });
		var max = d3.max(data, function(d) { return d.end_date });

		xScale.domain([min, max]);

		number_of_bars = data.length;
		canvas_height = number_of_bars * (bar_height + bar_margin_bottom) + container_top_padding + container_bottom_padding;

		console.log(data);
	}
	/*
	 * DRAW WITH DATA
	 */

	function initialRender() {
		// Create svg container
		var svg = d3.select('#svg-canvas')
			.append('svg')
				.attr('width', canvas_width)
				.attr('height', canvas_height);

		// Create base axis; assign scale made up above
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient('bottom');

		// Bottom Axis
		var btmAxis = svg.append('g')
			.attr('transform', 'translate(0,' + (canvas_height - 30) + ')')
			.attr('class', 'axis')
			.call(xAxis);

		// Top Axis
		var topAxis = svg.append('g')
			.attr('transform', 'translate(0,10)')
			.attr('class', 'axis')
			.call(xAxis);

		// Lines
		var line = svg.append('g')
			.selectAll('line')
			.data(xScale.ticks(10))
			.enter()
			.append('line')
				.attr('x1', xScale)
				.attr('x2', xScale)
				.attr('y1', 30)
				.attr('y2', canvas_height - 25)
				.style('stroke', '#ccc');

		var todayline = svg.append('line')
			.datum(today)
			// .datum(new Date(2014,1,14))
			.attr('x1', xScale)
			.attr('x2', xScale)
			.attr('y1', 0)
			.attr('y2', canvas_height - 25)
			.style('stroke', '#c00');

			milestones.forEach(function(milestone){
				var _milestones = svg.append('line')
			 	.data([milestone])
				.attr('x1', xScale(milestone.start_date) + 1)
				.attr('x2', xScale(milestone.start_date) + 1)
				.attr('y1', - 20)
				.attr('y2', canvas_height - 25)
				.style('stroke', '#666');
			});

		d3.select('#chart-canvas').style('height', canvas_height + 'px');


		ganttBarContainer = d3.select('#gantt-bar-container')
			.on('mousemove', function(d, i) {
				// Place mouse move on bar-container so the tooltip renders over the bars but sets to the xy of the bar it tips
				var xy = d3.mouse(this);
				// Update Tooltip Position & value
				tooltip
					.style('left', xy[0] + 'px')
					.style('top', xy[1] + 'px');
			});

		ganttBarContainer.append('div')
			.datum(today)
			.text('Today')
			.attr('class', 'todaymarker')
			.style('position', 'absolute')
			.style('top', '-45px')
			.style('left', function(d) { return (xScale(d) -1) + 'px' });

		milestones.forEach(function(milestone){
			ganttBarContainer.append('div')
			.data([milestone])
			.text(function(d) { return d.deliverable })
			.attr('class', 'milestone')
			.style('position', 'absolute')
			.style('top', '-45px')
			.style('left', function(d) { return xScale(d.start_date) + 'px'})

		})

	}

	var tooltip = d3.select('#tooltip');

	function render() {
		var filteredData = data;

		if (filter_selector) {
			filteredData = data.filter(function(d) { return d.type == filter_selector });
		}

		var barWrappers = ganttBarContainer.selectAll('.bar-wrapper')
			.data(filteredData, function(d) { return d.id });

		var bwe = barWrappers
			.enter()
			.append('div')
			.attr('class', function(d) { return 'bar-wrapper ' + d.type })
			.on('mouseover', function(d, i) {
				var tt = '';
				tt += '<p class="heading"><span id="keyword">' + d.team + '</span></p>';
				tt += '<p class="indent"><span id="bar-data">' + d.deliverable + '</span></p>';
				tt += '<p class="indent"><span id="cpcVal">' + dateFormat(d.start_date) + ' - ' + dateFormat(d.end_date) + '</span></p>';

				tooltip
					.style('border-left', '3px solid ' + teamColorScale(d.team))
					.html(tt);

				tooltip.style('display', 'block');
			})
			.on('mouseout', function(d, i) {
				tooltip.style('display', 'none');
			});

		var bars = bwe
			.append('div')
				.attr('class', 'bar')
				.style('margin-left', function(d, i) { return xScale(d.start_date) + 'px' })
				.style('width', function(d, i) { return xScale(d.end_date) - xScale(d.start_date) + 'px' });

		bars
			.append('div')
				.attr('class', 'bar-name')
				.text(function(d) { return d.deliverable });

		barWrappers.selectAll('.bar')
			.style('background', function(d) {
				if (color_selector == 'priority') {
					return priorityScale(d.priority);
				}
				if (color_selector == 'team') {
					return teamColorScale(d.team);
				}
			});

		// Set transitions to replace isotope
		barWrappers
			.transition()
			.duration(600)
			// .delay(function(d, i) { return i * 15 })
			.style('display', 'block')
			.style('opacity', 1)
			.style('top', function(d, i) {
				return i * (bar_height + bar_margin_bottom) + 'px';
			});

		barWrappers
			.exit()
			.transition()
			.style('opacity', 1e-6)
			.transition()
			.style('display', 'none');


	}

	// SORTING BUTTONS
	// So let's make a simple sort_ascending boolean variable and set it to true
	var sort_ascending = true;

	d3.selectAll('#sorter li')
		.on('click', function() {
		// Set it to what it isn't, if it was true, make it false and vice versa
		// When you click a button twice, it will flop its sort order; a simple toggle
		sort_ascending = !sort_ascending;
		var sorter_selector = d3.select(this).attr('data-sorter');
		console.log('SORT:', sorter_selector);

		data.sort(function(a, b) {
			if (sort_ascending) {
				return d3.ascending(a[sorter_selector], b[sorter_selector]);
			} else {
				return d3.descending(a[sorter_selector], b[sorter_selector]);
			}
		});
		render();
	});

	// FILTER BUTTONS
	d3.selectAll('#filter li').on('click', function() {
		filter_selector = d3.select(this).attr('data-filter');
		render();
	});

	// COLOR BUTTONS
	d3.selectAll('#color li').on('click', function() {
		color_selector = d3.select(this).attr('data-color');
		render(data);
	});

	/*
	 * CALL THE THINGS
	 * 'data/sample_data.csv'
	 * var proxy = 'http://www.enjoy-mondays.com/assets/services/proxy.php?url=';
	 */

	// WHERE WE PULL THE DATA
	//var csvURL = 'http://guarded-ocean-2049.herokuapp.com/https://docs.google.com/spreadsheets/d/1kx3Kv56gKo_XRhIXfmEN1su-Kjp5x6ieXHv9e8Sp67s/pub?gid=1081344356&single=true&output=csv';
	var csvURL = 'http://guarded-ocean-2049.herokuapp.com/https://docs.google.com/spreadsheet/pub?key=1IHocOhSxwA9XkO6rznmetSz_ATBIAPHgms4htOEd-tk&single=true&gid=0&output=csv';
	

	d3.csv(csvURL, function(csv) {
		tidyData(csv);
		initialRender();
		render();
	});

// })();
