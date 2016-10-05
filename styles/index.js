var categoryList = "#first,#second,#third,#archive";

var hide_lists = function (cb) {
    $('.category').fadeOut(300);
    $('.category-btn').removeClass('disabled');
};

function show_category(categoryName) {
    $('.category-btn').removeClass('disabled');
    $('.category').hide();

    fadeOutList = categoryList.repace("#" + categoryName);

 $('#' + categoryName).fadeIn(300);

    $('#' + categoryName + '-btn').addClass('disabled');
}
