$('.toggle').on('click', function() {
	console.log('sd');
  $('.container').stop().addClass('active');
});

$('.close').on('click', function() {
  $('.container').stop().removeClass('active');
});