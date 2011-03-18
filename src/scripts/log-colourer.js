/*!
 * Log Colourer.js v@VERSION
 * http://aligo.github.com/log-colourer.js
 * http://ellesime.anetcity.com/ellesime/bbs/index.php?topic=38402.0
 * https://github.com/aligo/log-colourer.js
 *
 *
 * Copyright 2011, aligo, http://aligo.me/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($, LogColourer, undefined ) {

    $(function(){

        var timestamp = Math.round(new Date().getTime() / 1000);

        var colourer = new LogColourer();

        $.fn.colorselecter = function(){
            $(this).find('[data-role=collapsible]').collapsible();
            $(this).find('[data-role=fieldcontain]').fieldcontain();
            $(this).find('select').selectmenu();
            $(this).find('input').textinput();
        };

        //binding events
        $('#first #log-format').change(function(){
            if("custom" === $(this).val()){
                $('#first #name-regexp, #first #drop-regexp').textinput('enable');
            }else{
                $('#first #name-regexp, #first #drop-regexp').textinput('disable');
                $('#first #name-regexp').val($(this).find('option:selected').data('name-regexp'));
                $('#first #drop-regexp').val($(this).find('option:selected').data('drop-regexp'));
            }
        });

        $('a.refresh').each(function(){
            $(this).attr('href', $(this).attr('href') + '?' + timestamp );
        });

        //init elements
        $('#first').bind('pageshow', function(){
            $(this).find('#log-format').trigger('change');
            colourer.init();
        });

        $('#second').bind('pagebeforeshow', function(){
            if(colourer.check()){

                $('#second #colourer_sets').html('');

                var time_selecter = $($('#second #color_selecter').html()
                                            .replace(/{id}/g, 'time').replace(/{field}/g, '时间'));
                $(time_selecter).find('option[value=same]').remove();
                var hide_selecter = $($('#second #color_selecter').html()
                                            .replace(/{id}/g, 'hide').replace(/{field}/g, '隐藏'));
                $(hide_selecter).find('option[value=same]').remove();
                $('#second #colourer_sets').append(time_selecter, hide_selecter);

                colourer.regexp($('#first #name-regexp').val(), $('#first #drop-regexp').val(), $('#first #hide-regexp').val())
                       .parse($('#first #log-text').val());

                $.each(colourer.names, function(id, name){
                    //html
                    var name_selecter = $($('#second #color_selecter').html()
                                            .replace(/{id}/g, 'name_' + id).replace(/{field}/g, '名字'));
                    $(name_selecter).find('option[value=same]').remove();
                    var said_selecter = $('#second #color_selecter').html()
                                            .replace(/{id}/g, 'said_' + id).replace(/{field}/g, '说话');
                    var done_selecter = $('#second #color_selecter').html()
                                            .replace(/{id}/g, 'done_' + id).replace(/{field}/g, '动作');
                    var colourer_set = $($('#second #colourer_set').html()
                                            .replace(/{id}/g, id).replace(/{name}/g, name));

                    $(colourer_set).find('p').append(name_selecter, said_selecter, done_selecter);

                    $('#second #colourer_sets').append(colourer_set);
                });

                //jquery mobile plugin
                $('#second #colourer_sets').colorselecter();

                //binding change events
                $('#second #colourer_sets select').change(function(){
                    var set = $('#' + $(this).attr('id').replace(/color_select_\S+_/g,'color_set_'));
                    var input = $('#' + $(this).attr('id').replace(/color_select/g,'color'));
                    var this_val = $(this).val();
                    if("custom" === this_val){
                        input.textinput('enable');
                    }else if("same" === this_val){
                        input.textinput('disable');
                        input.val(set.find('input').first().val()).trigger('change');
                    }else{
                        input.textinput('disable');
                        input.val(this_val).trigger('change');
                    }
                });
                $('#second #colourer_sets input').change(function(){
                    var this_id = $(this).attr('id');
                    var set_id = '#' + this_id.replace(/color_\S+_/g,'color_set_')
                    var class_type = set_id + ' .color_' + this_id.split('_')[1];
                    $(class_type).css('color', $(this).val());
                    if(-1 !== this_id.indexOf('_name_')){
                        $(set_id).find('select').each(function(){
                            if(-1 === $(this).attr('id').indexOf('_name_')){
                                $(this).trigger('change');
                            }
                        });
                    }
                });
            }
        });

        $('#second').bind('pageshow', function(){
            $(this).find('select').trigger('change');
        });

        $('#third').bind('pagebeforeshow', function(){
            $('#second ').find('input').each(function(){
                var ids = $(this).attr('id').split('_');
                if(ids[2] === undefined){
                    colourer.setColourer(ids[1], colourer.getColourerFunc($(this).val()));
                }else{
                    colourer.setNameColourer(ids[2], ids[1], colourer.getColourerFunc($(this).val()));
                }
            });
            var bbcode = colourer.output();
            $('#bbcode_output').val(bbcode);
            var html = bbcode.replace(/\[\/color\]/g, '</span>')
                             .replace(/\[color=([^\]]+)\]/g, '<span style="color: $1;">')
                             .replace(/\n/g, "<br />\n");
            $('#html_output').val(html);
            $('.preview_output').html(html);
        });

        $('.html_output, .preview_output').hide();
        $('#output_navbar a').click(function(){
            $('#output_navbar a').removeClass('ui-btn-active');
            $(this).addClass('ui-btn-active');
            $('#outputs>div').hide();
            $('#outputs .' + $(this).data('output') + '_output').show();
        });

    });

})(jQuery, (function($, undefined){
    String.prototype['toRegExp'] = function() {
        return new RegExp(this.replace(/^~\^(.*)~S$/, '^$1'));
    }
    var Colourer = function () {
	    this.init();
    };
    Colourer.prototype['check'] = function() {
        return this.changed;
    };
    Colourer.prototype['init'] = function() {
        this.rows = [];
	    this.names = [];
	    this.namescolourers = [];
	    this.colourers = [];
	    this.output_rows = [];
	    this.prev_color = '';
	    this.changed = true;
	    return this;
    };
    Colourer.prototype['regexp'] = function (name_regexp, drop_regexp, hide_regexp) {
        this.name_regexp = name_regexp.toRegExp();
	    this.drop_regexp = drop_regexp.toRegExp();
	    this.hide_regexp = hide_regexp.toRegExp();
	    return this;
    };
    Colourer.prototype['parse'] = function (logs) {
        var that = this;
        logs = logs.replace(/(?:\x0f|\x1f|\x02|\x03)(?:\d{1,2}(?:,\d{1,2})?)?/g,'');
        $.each(logs.split("\n"), function(i, line) {
            if(false === that.drop_regexp.test(line)){
                var result = that.name_regexp.exec(line);
                if(null !== result){
                    var name = (result[2] || result[3] || result[4]).split('|')[0];
                    if(-1 === that.names.indexOf(name)){
                        that.names.push(name);
                    }
                    var type = (result[3] !== '') ? 'done' : 'said';
                    var output = line.replace(result[0],'');
                    if(that.hide_regexp.test(output)){
                        type = 'hide';
                    }
                    //name, type, time, output_name, output
                    that.output_rows.push([name, type, result[1], result[0].replace(result[1],''), output]);
                }
            }
        });
        this.changed = false;
        return this;
    };
    Colourer.prototype['names'] = function() {
        return this.names;
    };
    Colourer.prototype['getColourerFunc'] = function(color) {
        return function(text, prev_color) {
            var prefix = '';
            if(prev_color !== color){
                if('' !== prev_color){
                    prefix = '[/color]';
                }
                if('' !== color){
                    text = '[color=' + color + ']' + text;
                }
            }
            return [prefix + text, color];
        };
    };
    Colourer.prototype['setColourer'] = function(type, func) {
        this.colourers[type] = func;
        return this;
    };
    Colourer.prototype['setNameColourer'] = function(i, type, func) {
        if(undefined === this.namescolourers[i]) {
            this.namescolourers[i] = [];
        }
        this.namescolourers[i][type] = func;
        return this;
    };
    Colourer.prototype['callNameColourer'] = function(i, type, text) {
        if(type === 'hide' || type === 'time'){
            var func = this.colourers[type];
        }else{
            var func = this.namescolourers[i][type];
        }
        if(undefined !== func) {
            var result = func(text, this.prev_color);
            text = result[0];
            this.prev_color = result[1];
        }
        return text;
    };
    Colourer.prototype['output'] = function() {
        var output = '';
        var that = this;
        $.each(this.output_rows, function(nor, row) {
            var i = that.names.indexOf(row[0]);
            output = output + that.callNameColourer(i, 'time', row[2])
                            + that.callNameColourer(i, 'name', row[3])
                            + that.callNameColourer(i, row[1], row[4])
                            + "\n";
        });
        if('' !== this.prev_color) {
            output = output + '[/color]';
        }
        return output.replace(/\n\[\/color\]/g, "[/color]\n");
    };
    return Colourer;
})(jQuery));

