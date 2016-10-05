var hide_lists = function (cb) {
    $('#first').fadeOut(300);
    $('#second').fadeOut(300);
    $('#third').fadeOut(300);
    $('#fourth').fadeOut(300);
    $('#fifth').fadeOut(300);
    $('#first-btn').removeClass('disabled');
    $('#second-btn').removeClass('disabled');
    $('#third-btn').removeClass('disabled');
    $('#fourth-btn').removeClass('disabled');
    $('#fifth-btn').removeClass('disabled');
};

var show_first = function () {
    $('#first-btn').removeClass('disabled');
    $('#first').fadeOut(300, function () {
      $('#second').fadeIn(300);
      $('#third').fadeIn(300);
      $('#fourth').fadeIn(300);
      $('#fifth').fadeIn(300);
    });
    $('#second-btn').addClass('disabled');
    $('#third-btn').addClass('disabled');
    $('#fourth-btn').addClass('disabled');
    $('#fifth-btn').addClass('disabled');
};

var show_second = function () {
    $('#second-btn').removeClass('disabled');
    $('#second').fadeOut(function () {
      $('#first').fadeIn(300);
      $('#third').fadeIn(300);
      $('#fourth').fadeIn(300);
      $('#fifth').fadeIn(300);
    });
    $('#first-btn').addClass('disabled');
    $('#third-btn').addClass('disabled');
    $('#fourth-btn').addClass('disabled');
    $('#fifth-btn').addClass('disabled');
};

var show_third = function () {
    $('#third-btn').removeClass('disabled');
    $('#third').fadeOut(function () {
      $('#first').fadeIn(300);
      $('#second').fadeIn(300);
      $('#fourth').fadeIn(300);
      $('#fifth').fadeIn(300);
    });
    $('#first-btn').addClass('disabled');
    $('#second-btn').addClass('disabled');
    $('#fourth-btn').addClass('disabled');
    $('#fifth-btn').addClass('disabled');
};

var show_fourth = function () {
    $('#fourth-btn').removeClass('disabled');
    $('#fourth').fadeOut(function () {
      $('#first').fadeIn(300);
      $('#second').fadeIn(300);
      $('#third').fadeIn(300);
      $('#fifth').fadeIn(300);
    });
    $('#first-btn').addClass('disabled');
    $('#second-btn').addClass('disabled');
    $('#third-btn').addClass('disabled');
    $('#fifth-btn').addClass('disabled');
};


var show_fifth = function () {
    $('#fifth-btn').removeClass('disabled');
    $('#fifth').fadeOut(function () {
      $('#first').fadeIn(300);
      $('#second').fadeIn(300);
      $('#third').fadeIn(300);
      $('#fourth').fadeIn(300);
    });
    $('#first-btn').addClass('disabled');
    $('#second-btn').addClass('disabled');
    $('#third-btn').addClass('disabled');
    $('#fourth-btn').addClass('disabled');
};
