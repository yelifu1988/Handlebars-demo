$(function () {
    //列表地址
    var GETCLASSES = "http://imoocnote.calfnote.com/inter/getClasses.php";
    //大纲地址
    var GETCLASSCHAPTER = "http://imoocnote.calfnote.com/inter/getClassChapter.php";
    //笔记地址
    var GETCLASSNOTE = "http://imoocnote.calfnote.com/inter/getClassNote.php";
    //ajsx全局错误处理函数
    $.ajaxSetup({
        error: function () {
            alert('调用接口失败！');
            return false;
        }
    });

    //Handlebars渲染函数
    function renderTemplate(templateSelector,data,htmlSelector) {
        var t = $(templateSelector).html();
        var f = Handlebars.compile(t);
        var h = f(data);
        $(htmlSelector).html(h);
    }
    //点击分页传递当前页数重新渲染页面的函数
    function refreshclasses(curPage) {
        $.getJSON(GETCLASSES,{curPage: curPage},function (data) {
            renderTemplate("#class-template", data.data, "#classes");
            renderTemplate("#pag-template", formatPag(data), "#pag");
            //点击渲染玩页面还需要重新绑定一下事件 每次点击还要重新绑定比较low逼，所以要写一个委托绑定的函数还替换这个low逼的行为
            // $('li.clickable').on('click',function () {
            //     $this = $(this);//封装每次点击的this到一个变量 这样每次点击就不会再次封装jq对象 提高性能
            //     $this.data('id');
            //     console.log($this.data('id'));
            //     refreshclasses($this.data('id'));
            // })
        });
    };
    
    //委托绑定函数
    function bindPageEvent() {
        $('#pag').delegate('li.clickable','click',function () {
            $this = $(this);//封装每次点击的this到一个变量 这样每次点击就不会再次封装jq对象 提高性能
            $this.data('id');
            console.log($this.data('id'));
            refreshclasses($this.data('id'));
        })
    };
    bindPageEvent();

    $.getJSON(GETCLASSES,{curPage: 1},function (data) {
        console.log(data);
        renderTemplate("#class-template",data.data,"#classes");
        renderTemplate("#pag-template",formatPag(data),"#pag");
        // $('li.clickable').on('click',function () {
        //     $this = $(this);//封装每次点击的this到一个变量 这样每次点击就不会再次封装jq对象 提高性能
        //     $this.data('id');
        //     console.log($this.data('id'));
        //     refreshclasses($this.data('id'));
        // })
    });
    
    //遮罩层和笔记本div显示隐藏函数
    function showNote(show) {
        if (show){
            $('.overlap').css('display','block');
            $('.notedetail').css('display','block');
        } else {
            $('.overlap').css('display','none');
            $('.notedetail').css('display','none');
        }
    }

    //点击遮罩层的时候隐藏
    $('.overlap').on('click',function () {
        showNote(false);
    })

    //委托绑定 点击显示
    function bindClassEvent() {
        $('#classes').delegate('li','click',function () {
            $this = $(this);
            var cid = $this.data('id');

            // //大纲渲染
            // $.getJSON(GETCLASSCHAPTER,{cid: cid},function (data) {
            //     console.log(data);
            //     renderTemplate("#chapter-template",data,"#chapterdiv")
            //     showNote(true);
            // });
            // //笔记渲染
            // $.getJSON(GETCLASSNOTE,{cid: cid},function (data) {
            //     console.log(data);
            //     //renderTemplate("#notediv-template",data,"#notediv")
            //     showNote(true);
            // });

            //通过$.when当两个ajax请求都返回成功的时候做一个统一的回调处理
            $.when($.getJSON(GETCLASSCHAPTER, {
                cid: cid
            }), $.getJSON(GETCLASSNOTE, {
                cid: cid
            })).done(function (cData, nData) {
                console.log(cData);
                console.log(nData);
                renderTemplate("#chapter-template", cData[0], "#chapterdiv");
                renderTemplate("#note-template", nData[0], "#notediv");
                showNote(true);
            });

        })
    }
    bindClassEvent();


    Handlebars.registerHelper("equal",function (v1,v2,options) {
        if (v1==v2){
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("long",function (v,options) {
        if (v.indexOf('小时') != -1){
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("addone",function (value) {
        return value+1;
    });
    //时间转换helper
    Handlebars.registerHelper("formatDate", function (value) {
        if (!value) {
            return "";
        }

        var d = new Date(value);
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var date = d.getDate();
        var hour = d.getHours();
        var minute = d.getMinutes();
        var second = d.getSeconds();
        var str = year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;

        return str;
    });


    // 构建分页逻辑所需要的数据
    // registerHelper的使用原则：不要在里面拼接大段的HTML代码。
    // 类似本利中的分页组件，最好是构造一份适合Handlebars的数据，然后传给它，来生成html。
    function formatPag(pagData) {
        var arr = [];
        var total = parseInt(pagData.totalCount);
        var cur = parseInt(pagData.curPage);

        // 处理首页的逻辑：<<
        var toLeft = {};
        toLeft.index = 1; // index代表点击按钮的时候可以跳转到的页面
        toLeft.text = '&laquo;'; // text代表button的文本

        if (cur != 1) {
            toLeft.clickable = true;
        }
        arr.push(toLeft);

        // 处理到上一页的逻辑
        var pre = {};
        pre.index = cur - 1;
        pre.text = '&lsaquo;';

        if (cur != 1) {
            pre.clickable = true;
        }

        arr.push(pre);

        // 处理到cur页前的逻辑
        if (cur <= 5) {
            for (var i = 1; i < cur; i++) {
                var pag = {};
                pag.text = i;
                pag.index = i;
                pag.clickable = true;
                arr.push(pag);
            }
        } else {
            // 如果cur>5，那么cur前的页要显示为...
            var pag = {};
            pag.text = 1;
            pag.index = 1;
            pag.clickable = true;
            arr.push(pag);
            var pag = {};
            pag.text = '...';
            arr.push(pag);
            // 当前页前面2个页数显示出来
            for (var i = cur - 2; i < cur; i++) {
                var pag = {};
                pag.text = i;
                pag.index = i;
                pag.clickable = true;
                arr.push(pag);
            }
        }

        // 处理当前页
        var pag = {};
        pag.text = cur;
        pag.index = cur;
        pag.cur = true;
        arr.push(pag);

        // 处理cur页后的逻辑
        if (cur >= total - 4) {
            for (var i = cur + 1; i <= total; i++) {
                var pag = {};
                pag.text = i;
                pag.index = i;
                pag.clickable = true;
                arr.push(pag);
            }
        } else {
            // 如果cur < total - 4, 那么cur后的页面显示为...
            // 显示以当前页后面的2个页数
            for (var i = cur + 1; i <= cur + 2; i++) {
                var pag = {};
                pag.text = i;
                pag.index = i;
                pag.clickable = true;
                arr.push(pag);
            }

            var pag = {};
            pag.text = '...';
            arr.push(pag);
            var pag = {};
            pag.text = total;
            pag.index = total;
            pag.clickable = true;
            arr.push(pag);
        }

        // 处理到下一页的逻辑
        var next = {};
        next.index = cur + 1;
        next.text = '&rsaquo;';

        if (cur != total) {
            next.clickable = true;
        }

        arr.push(next);

        // 处理到尾页的逻辑
        var toRight = {};
        toRight.index = total; // index代表点击按钮的时候可以跳转到的页面
        toRight.text = '&raquo;'; // text代表button的文本

        if (cur != total) {
            toRight.clickable = true;
        }
        arr.push(toRight);
        console.log(arr);
        return arr;
    }
})

