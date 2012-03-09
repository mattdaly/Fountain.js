// Fountain-parser.js 0.2.0
// http://www.opensource.org/licenses/mit-license.php
// Copyright (c) 2012 Matt Daly

;(function ($, window, document, undefined) {
  // element removal callback
  var removeThis = function () { $(this).remove(); };

  $.fn.fountain = function (args) {
    if (typeof args === 'object' || !args) {
      return this.each(function () {  
        var $app       = $(this)
          , $dock      = $(document.getElementById('dock'))
          , $workspace = $(document.getElementById('workspace'));
        
        var dragOver = function (e) {
            $(this).addClass('over');
            e.stopPropagation();
            e.preventDefault();
        };

        var dragLeave = function (e) {
            $(this).removeClass('over');
            e.stopPropagation();
            e.preventDefault();
        };

        var loadScript = function (e) {
          e.preventDefault();
          e.stopPropagation();            
          e = e.originalEvent;

          $(this).removeClass('over');

          var file   = e.dataTransfer.files[0]
            , reader = new FileReader();
 
          if (file) {  
            reader.onload = function(evt) {
              $app.trigger('fountain-js:loaded', [evt.target.result]);
            }  

            reader.readAsText(file);
          }
        };

        if (!$app || !$dock || !$workspace ) { console.log('Fountain.js - Environment not set up correctly.'); return; }

        // dock
        $(document.getElementById('file-api')).fadeIn().on('dragleave', dragLeave).on('dragover', dragOver).on('drop', loadScript);

        // workspace                
        var settings    = $.extend({}, $.fn.fountain.defaults, args)
          , $header     = $workspace.find('header')
          , $container  = $header.find('.container')
          , $title      = $(document.getElementById('script-title'))
          , $navigation = $(document.getElementById('navigation'))
          , $toolbar    = $(document.getElementById('toolbar'))
          , $toolbar    = $(document.getElementById('toolbar'))
          , $script     = $(document.getElementById('script')).addClass(settings.paper).addClass('dpi' + settings.dpi)
          , $backdrop   = $(document.createElement('div')).addClass('backdrop');
 
        var page = function (html, isTitlePage) {
          var $output = $(document.createElement('div')).addClass('page').html(html);
                    
          if (isTitlePage) {
            $output.addClass('title-page');
          } else {
            $output.children('div.dialogue.dual').each(function() {
              dual = $(this).prev('div.dialogue');
              $(this).wrap($(document.createElement('div')).addClass('dual-dialogue'));
              dual.prependTo($(this).parent());
            });
          }

          return $output;
        };

        // notifications
        var notify = function (text) {
          $workspace.find('.notification').remove();
          $(document.createElement('p')).addClass('notification').attr('contenteditable', 'false').text(text).appendTo($workspace).fadeIn(200).delay(2000).fadeOut(1000, function() {
            removeThis();           
          });
        };

        // toolbar
        $toolbar.find('.dock').on('click', function () {
          $app.trigger('fountain-js:dock');
        }).on('dragleave', dragLeave).on('dragover', dragOver).on('drop', loadScript);

        $toolbar.find('.dim').on('click', function () {
          $header.toggleClass('dimmed');
          settings.dimmed = !settings.dimmed;

          $(this).toggleClass('increase');

          notify('Header ' + (settings.dimmed ? 'dimmed' : 'restored'));
        });

        $toolbar.find('.resize').on('click', function () {
          $script.removeClass('dpi' + settings.dpi);
          settings.dpi = settings.dpi === 72 ? 100 : 72;
          $script.addClass('dpi' + settings.dpi);
          $container.width($script.width());

          $(this).toggleClass('large');

          notify('Script resized to ' + settings.dpi + ' dpi');
        });

        $app.on('fountain-js:dock', function () {
          $workspace.hide();
          $script.empty();
          $dock.show();
        });
        
        $app.on('fountain-js:loaded', function (e, file) {
          $dock.hide();
          $script.empty();
          fountain.parse(file, function (result) {
            if (result) {
              if (result.title && result.html.title_page) {
                $script.append(page(result.html.title_page, true));
                $title.html(result.title || 'Untitled');
              }
              $script.append(page(result.html.script));
              $workspace.fadeIn();
              notify($title.text() + ' loaded!');
            }          
          }); 
        });
      });    
    }   
  };

  $.fn.fountain.defaults = {
    dimmed: false,
    dpi: 100,
    paper: 'us-letter'
  }; 
})(jQuery, window, document);

$(function() {
  var $error = $(document.createElement('p')).addClass('error');
  if (!window.File || !window.FileReader) {
    $('#file-api').remove();
    $error.html('Oops, your browser doesn\'t support the HTML 5 File API. Work is underway to improve compatibilty, hang tight!').appendTo($('#dock > .container'));
  } else if (typeof fountain === 'undefined') {
    $('#file-api').remove();
    $error.html('Oops, the necessary files don\'t seem to have been included. You need fountain.js/fountain.min.js!').appendTo($('#dock > .container'));  
  } else {    
    $('#fountain-js').fountain();
  }  
});
