var hide_lists = function (cb) {
    $('#first').fadeOut(300);
    $('#second').fadeOut(300);
    $('#archive').fadeOut(300);
    $('#first-btn').removeClass('disabled');
    $('#second-btn').removeClass('disabled');
    $('#archive-btn').removeClass('disabled');
};

var show_first = function () {
    $('#second-btn').removeClass('disabled');
    $('#archive-btn').removeClass('disabled');
    $('#first').fadeIn(300, function () {
      $('#second').fadeOut(300);
      $('#archive').fadeOut(300);
    });
    $('#first-btn').addClass('disabled');
};

var show_second = function () {
    $('#first-btn').removeClass('disabled');
    $('#archive-btn').removeClass('disabled');
    $('#second').fadeIn(function () {
      $('#first').fadeOut(300);
      $('#archive').fadeOut(300);
    });
    $('#second-btn').addClass('disabled');
};

var show_archive = function () {
    $('#first-btn').removeClass('disabled');
    $('#second-btn').removeClass('disabled');
    $('#archive').fadeIn(function () {
      $('#first').fadeOut(300);
      $('#second').fadeOut(300);
    });
    $('#archive-btn').addClass('disabled');
};
