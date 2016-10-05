var hide_lists = function (cb) {
    $('.category').fadeOut(300);
    $('.category-btn').removeClass('disabled');
};

function show_category(categoryName) {
    $('.category-btn').removeClass('disabled');
    $('.category').fadeOut(300, function () {
      $('#' + categoryName).fadeIn(300);
    });
    $('#' + categoryName + '-btn').addClass('disabled');
}
