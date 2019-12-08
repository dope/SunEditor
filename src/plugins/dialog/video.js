/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
'use strict';

import dialog from '../modules/dialog';
import resizing from '../modules/resizing';

export default {
    name: 'video',
    add: function (core) {
        core.addModule([dialog, resizing]);

        const context = core.context;
        context.video = {
            sizeUnit: context.option._videoSizeUnit,
            _container: null,
            _cover: null,
            _element: null,
            _element_w: 1,
            _element_h: 1,
            _element_l: 0,
            _element_t: 0,
            _defaultSizeX: '100%',
            _defaultSizeY: (context.option.videoRatio * 100) + '%',
            _origin_w: context.option.videoWidth === '100%' ? '' : context.option.videoWidth,
            _origin_h: '',
            _proportionChecked: true,
            _align: 'none',
            _floatClassRegExp: '__se__float\\-[a-z]+',
            _resizing: context.option.videoResizing,
            _rotation: context.option.videoRotation,
            _onlyPercentage: context.option.videoSizeOnlyPercentage,
            _ratio: false,
            _ratioX: 1,
            _ratioY: 1,
            _youtubeQuery: context.option.youtubeQuery,
            _videoRatio: (context.option.videoRatio * 100) + '%',
            _defaultRatio: (context.option.videoRatio * 100) + '%'
        };

        /** video dialog */
        let video_dialog = this.setDialog.call(core);
        context.video.modal = video_dialog;
        context.video.focusElement = video_dialog.querySelector('._se_video_url');

        /** add event listeners */
        video_dialog.querySelector('.se-btn-primary').addEventListener('click', this.submit.bind(core));

        context.video.proportion = {};
        context.video.videoRatioOption = {};
        context.video.inputX = {};
        context.video.inputY = {};
        if (context.option.videoResizing) {
            context.video.proportion = video_dialog.querySelector('._se_video_check_proportion');
            context.video.videoRatioOption = video_dialog.querySelector('.se-video-ratio');
            context.video.inputX = video_dialog.querySelector('._se_video_size_x');
            context.video.inputY = video_dialog.querySelector('._se_video_size_y');
            context.video.inputX.value = context.option.videoWidth;

            context.video.inputX.addEventListener('keyup', this.setInputSize.bind(core, 'x'));
            context.video.inputY.addEventListener('keyup', this.setInputSize.bind(core, 'y'));

            context.video.inputX.addEventListener('change', this.setRatio.bind(core));
            context.video.inputY.addEventListener('change', this.setRatio.bind(core));
            context.video.proportion.addEventListener('change', this.setRatio.bind(core));
            context.video.videoRatioOption.addEventListener('change', this.setVideoRatio.bind(core));

            video_dialog.querySelector('.se-dialog-btn-revert').addEventListener('click', this.sizeRevert.bind(core));
        }

        /** append html */
        context.dialog.modal.appendChild(video_dialog);

        /** empty memory */
        video_dialog = null;
    },

    /** dialog */
    setDialog: function () {
        const option = this.context.option;
        const lang = this.lang;
        const dialog = this.util.createElement('DIV');

        dialog.className = 'se-dialog-content';
        dialog.style.display = 'none';
        let html = '' +
            '<form class="editor_video">' +
                '<div class="se-dialog-header">' +
                    '<button type="button" data-command="close" class="close" aria-label="Close" title="' + lang.dialogBox.close + '">' +
                        '<i aria-hidden="true" data-command="close" class="se-icon-cancel"></i>' +
                    '</button>' +
                    '<span class="se-modal-title">' + lang.dialogBox.videoBox.title + '</span>' +
                '</div>' +
                '<div class="se-dialog-body">' +
                    '<div class="se-dialog-form">' +
                        '<label>' + lang.dialogBox.videoBox.url + '</label>' +
                        '<input class="se-input-form _se_video_url" type="text" />' +
                    '</div>';

            if (option.videoResizing) {
                const onlyPercentage = option.videoSizeOnlyPercentage;
                const onlyPercentDisplay = onlyPercentage ? ' style="display: none !important;"' : '';
                html += '<div class="se-dialog-form">';
                        if (onlyPercentage) {
                            html += '' +
                            '<div class="se-dialog-size-text">' +
                                '<label class="size-w">' + lang.dialogBox.size + '</label>' +
                            '</div>';
                        } else {
                            html += '' +
                            '<div class="se-dialog-size-text">' +
                                '<label class="size-w">' + lang.dialogBox.width + '</label>' +
                                '<label class="se-dialog-size-x">&nbsp;</label>' +
                                '<label class="size-h">' + lang.dialogBox.height + '</label>' +
                            '</div>';
                        }
                        html += '' +
                        '<input class="se-input-control _se_video_size_x" placeholder="100%"' + (onlyPercentage ? ' type="number" min="1"' : 'type="text"') + (onlyPercentage ? ' max="100"' : '') + '/>' +
                        '<label class="se-dialog-size-x">' + (onlyPercentage ? '%' : 'x') + '</label>' +
                        '<input type="text" class="se-input-control _se_video_size_y" placeholder="' + (option.videoRatio * 100) + '%"' + onlyPercentDisplay + (onlyPercentage ? ' max="100"' : '') + '/>' +
                        '<select class="se-input-select se-video-ratio" title="' + lang.dialogBox.ratio + '">' +
                            '<option value=""> - </option>' +
                            '<option value="0.5625" selected>16:9</option>' +
                            '<option value="0.75">4:3</option>' +
                            '<option value="0.4286">21:9</option>' +
                        '</select>' +
                        '<label' + onlyPercentDisplay + '><input type="checkbox" class="se-dialog-btn-check _se_video_check_proportion" checked/>&nbsp;' + lang.dialogBox.proportion + '</label>' +
                        '<button type="button" title="' + lang.dialogBox.revertButton + '" class="se-btn se-dialog-btn-revert" style="float: right;"><i class="se-icon-revert"></i></button>' +
                    '</div>';
            }

            html += '' +
                '</div>' +
                '<div class="se-dialog-footer">' +
                    '<div>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="none" checked>' + lang.dialogBox.basic + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="left">' + lang.dialogBox.left + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="center">' + lang.dialogBox.center + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-dialog-btn-radio" value="right">' + lang.dialogBox.right + '</label>' +
                    '</div>' +
                    '<button type="submit" class="se-btn-primary" title="' + lang.dialogBox.submitButton + '"><span>' + lang.dialogBox.submitButton + '</span></button>' +
                '</div>' +
            '</form>';

        dialog.innerHTML = html;

        return dialog;
    },
    
    setVideoRatio: function (e) {
        const contextVideo = this.context.video;
        const value = e.target.options[e.target.selectedIndex].value;

        contextVideo._videoRatio = !value ? 1 : (value * 100) + '%';
        contextVideo.inputY.placeholder = !value ? '' : (value * 100) + '%';
        contextVideo.inputY.value = '';
    },

    setInputSize: function (xy, e) {
        if (e && e.keyCode === 32) {
            e.preventDefault();
            return;
        }

        this.plugins.resizing._module_setInputSize.call(this, this.context.video, xy);

        if (xy === 'y') {
            this.plugins.video.setVideoRatioSelect.call(this, e.target.value || this.context.video._videoRatio);
        }
    },

    setRatio: function () {
        this.plugins.resizing._module_setRatio.call(this, this.context.video);
    },

    _onload_video: function (frame) {
        this.plugins.video.setVideosInfo.call(this, frame);
    },

    submitAction: function () {
        if (this.context.video.focusElement.value.trim().length === 0) return false;
        this.context.resizing._resize_plugin = 'video';

        const contextVideo = this.context.video;
        const w = (this.util.isNumber(contextVideo.inputX.value) ? contextVideo.inputX.value : this.context.option.videoWidth);
        const h = (this.util.isNumber(contextVideo.inputY.value) ? contextVideo.inputY.value : this.context.option.videoHeight);
        let oIframe = null;
        let cover = null;
        let container = null;
        let url = contextVideo.focusElement.value.trim();
        contextVideo._align = contextVideo.modal.querySelector('input[name="suneditor_video_radio"]:checked').value;

        /** iframe source */
        if (/^<iframe.*\/iframe>$/.test(url)) {
            oIframe = (new this._w.DOMParser()).parseFromString(url, 'text/html').querySelector('iframe');
        }
        /** url */
        else {
            oIframe = this.util.createElement('IFRAME');
            /** youtube */
            if (/youtu\.?be/.test(url)) {
                if (!/^http/.test(url)) url = 'https://' + url;
                url = url.replace('watch?v=', '');
                if (!/^\/\/.+\/embed\//.test(url)) {
                    url = url.replace(url.match(/\/\/.+\//)[0], '//www.youtube.com/embed/').replace('&', '?&');
                }

                if (contextVideo._youtubeQuery.length > 0) {
                    if (/\?/.test(url)) {
                        const splitUrl = url.split('?');
                        url = splitUrl[0] + '?' + contextVideo._youtubeQuery + '&' + splitUrl[1];
                    } else {
                        url += '?' + contextVideo._youtubeQuery;
                    }
                }
            }
            oIframe.src = url;
        }

        /** update */
        if (this.context.dialog.updateModal) {
            if (contextVideo._element.src !== oIframe.src) contextVideo._element.src = oIframe.src;
            container = contextVideo._container;
            cover = this.util.getParentElement(contextVideo._element, 'FIGURE');
            oIframe = contextVideo._element;
        }
        /** create */
        else {
            oIframe.frameBorder = '0';
            oIframe.allowFullscreen = true;
            oIframe.addEventListener('load', this.plugins.video._onload_video.bind(this, oIframe));
            contextVideo._element = oIframe;

            /** cover */
            cover = this.plugins.resizing.set_cover.call(this, oIframe);

            /** container */
            container = this.plugins.resizing.set_container.call(this, cover, 'se-video-container');
            this._variable._videosCnt++;
        }


        /** rendering */
        contextVideo._cover = cover;
        contextVideo._container = container;

        const changeSize = !this.context.dialog.updateModal || this.plugins.resizing._module_isChange.call(this, contextVideo);

        if (contextVideo._resizing) {
            this.context.video._proportionChecked = contextVideo.proportion.checked;
            oIframe.setAttribute('data-proportion', contextVideo._proportionChecked);
        }

        // size
        if (changeSize) {
            this.plugins.video.applySize.call(this);
        }

        // align
        this.plugins.video.setAlign.call(this, null, oIframe, cover, container);

        if (!this.context.dialog.updateModal) {
            this.insertComponent(container);
        }
        else if (/\d+/.test(cover.style.height) || (contextVideo._resizing && changeSize) || this.context.resizing._rotateVertical) {
            this.plugins.resizing.setTransformSize.call(this, oIframe, null, null);
        }

        // history stack
        this.history.push();
        this.context.resizing._resize_plugin = '';
    },

    setVideosInfo: function (frame) {
        if (!frame.getAttribute('data-origin')) {
            const container = this.util.getParentElement(frame, this.util.isComponent);
            const cover = this.util.getParentElement(frame, 'FIGURE');

            const w = this.plugins.resizing._module_getSizeX.call(this, this.context.video, frame, cover, container);
            const h = this.plugins.resizing._module_getSizeY.call(this, this.context.video, frame, cover, container);
            
            frame.setAttribute('data-origin', w + ',' + h);
            frame.setAttribute('data-size', w + ',' + h);
        }
    },

    submit: function (e) {
        this.showLoading();

        e.preventDefault();
        e.stopPropagation();

        try {
            this.plugins.video.submitAction.call(this);
        } finally {
            this.plugins.dialog.close.call(this);
            this.closeLoading();
        }

        this.focus();

        return false;
    },

    _update_videoCover: function (oIframe) {
        const contextVideo = this.context.video;

        oIframe.frameBorder = '0';
        oIframe.allowFullscreen = true;
        oIframe.onload = oIframe.addEventListener('load', this.plugins.video._onload_video.bind(this, oIframe));
        
        const existElement = this.util.getParentElement(oIframe, this.util.isComponent) || 
            this.util.getParentElement(oIframe, function (current) {
                return this.isWysiwygDiv(current.parentNode);
            }.bind(this.util));

        contextVideo._element = oIframe = oIframe.cloneNode(false);
        const cover = contextVideo._cover = this.plugins.resizing.set_cover.call(this, oIframe);
        const container = contextVideo._container = this.plugins.resizing.set_container.call(this, cover, 'se-video-container');

        const figcaption = existElement.getElementsByTagName('FIGCAPTION')[0];
        let caption = null;
        if (!!figcaption) {
            caption = this.util.createElement('DIV');
            caption.innerHTML = figcaption.innerHTML;
            this.util.removeItem(figcaption);
        }

        const size = (oIframe.getAttribute('data-size') || oIframe.getAttribute('data-origin') || '').split(',');
        const w = size[0] || this.context.option.videoWidth;
        const h = size[1] || this.context.option.videoHeight;
        this.plugins.video.applySize.call(this, w, h);

        existElement.parentNode.insertBefore(container, existElement);
        if (!!caption) existElement.parentNode.insertBefore(caption, existElement);
        this.util.removeItem(existElement);
    },

    onModifyMode: function (element, size) {
        const contextVideo = this.context.video;
        contextVideo._element = element;
        contextVideo._cover = this.util.getParentElement(element, 'FIGURE');
        contextVideo._container = this.util.getParentElement(element, this.util.isComponent);

        contextVideo._align = element.getAttribute('data-align') || 'none';

        contextVideo._element_w = size.w;
        contextVideo._element_h = size.h;
        contextVideo._element_t = size.t;
        contextVideo._element_l = size.l;

        let origin = contextVideo._element.getAttribute('data-size') || contextVideo._element.getAttribute('data-origin');
        if (origin) {
            origin = origin.split(',');
            contextVideo._origin_w = origin[0];
            contextVideo._origin_h = origin[1];
        } else {
            contextVideo._origin_w = size.w;
            contextVideo._origin_h = size.h;
        }
    },

    openModify: function (notOpen) {
        const contextVideo = this.context.video;

        contextVideo.focusElement.value = contextVideo._element.src;
        contextVideo.modal.querySelector('input[name="suneditor_video_radio"][value="' + contextVideo._align + '"]').checked = true;

        if (contextVideo._resizing) {
            this.plugins.resizing._module_setModifyInputSize.call(this, contextVideo, this.plugins.video);
            
            let y = this.plugins.resizing._module_getSizeY.call(this, contextVideo);
            this.plugins.video.setVideoRatioSelect.call(this, y);
        }

        if (!notOpen) this.plugins.dialog.open.call(this, 'video', true);
    },

    on: function (update) {
        if (!update) {
            const contextVideo = this.context.video;
            contextVideo.inputX.value = contextVideo._origin_w = this.context.option.videoWidth === contextVideo._defaultSizeX ? '' : this.context.option.videoWidth;
            contextVideo.inputY.value = contextVideo._origin_h = '';
            contextVideo.proportion.disabled = true;
        }
    },
    
    setVideoRatioSelect: function (value) {
        const contextVideo = this.context.video;
        const ratioOptions = contextVideo.videoRatioOption.options;

        if (/%$/.test(value)) value = (this.util.getNumber(value, 2) / 100) + '';
        else if (!this.util.isNumber(value) || (value * 1) >= 1) value = '';

        for (let i = 0, len = ratioOptions.length; i < len; i++) {
            if (ratioOptions[i].value === value) ratioOptions[i].selected = true;
            else ratioOptions[i].selected = false;
        }

        contextVideo.inputY.placeholder = !value ? '' : (value * 100) + '%';
    },

    checkVideosInfo: function () {
        const videos = this.context.element.wysiwyg.getElementsByTagName('IFRAME');
        if (videos.length === this._variable._videosCnt) return;

        this.context.resizing._resize_plugin = 'video';
        const videoPlugin = this.plugins.video;
        this._variable._videosCnt = videos.length;

        for (let i = 0, len = this._variable._videosCnt, video, container; i < len; i++) {
            video = videos[i];
            container = this.util.getParentElement(video, this.util.isComponent);
            if (!container || container.getElementsByTagName('figcaption').length > 0 || !video.style.width) {
                videoPlugin._update_videoCover.call(this, video);
            }
        }

        this.context.resizing._resize_plugin = '';
    },

    sizeRevert: function () {
        this.plugins.resizing._module_sizeRevert.call(this, this.context.video);
    },

    applySize: function (w, h) {
        const contextVideo = this.context.video;

        if (!w) w = contextVideo.inputX.value;
        if (!h) h = contextVideo.inputY.value;
        
        if (contextVideo._onlyPercentage || /%$/.test(w) || !w) {
            this.plugins.video.setPercentSize.call(this, (w || '100%'), (h || contextVideo._videoRatio));
        } else if ((!w || w === 'auto') && (!h || h === 'auto')) {
            this.plugins.video.setAutoSize.call(this);
        } else {
            this.plugins.video.setSize.call(this, w, (h || contextVideo._defaultRatio), false);
        }
    },

    setSize: function (w, h, notResetPercentage) {
        const contextVideo = this.context.video;

        w = this.util.getNumber(w, 0);
        h = this.util.isNumber(h) ? h + contextVideo.sizeUnit : !h ? '' : h;

        contextVideo._element.style.width = w ? w + contextVideo.sizeUnit : '';
        contextVideo._cover.style.paddingBottom = contextVideo._cover.style.height = h;
        if (!/%$/.test(h)) contextVideo._element.style.height = h;
        else contextVideo._element.style.height = '';

        if (!notResetPercentage) contextVideo._element.removeAttribute('data-percentage');

        // save current size
        this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
    },

    setAutoSize: function () {
        this.plugins.video.setPercentSize.call(this, 100, this.context.video._videoRatio);
    },

    setOriginSize: function () {
        const contextVideo = this.context.video;
        contextVideo._element.removeAttribute('data-percentage');

        this.plugins.resizing.resetTransform.call(this, contextVideo._element);
        this.plugins.video.cancelPercentAttr.call(this);

        const originSize = (contextVideo._element.getAttribute('data-origin') || '').split(',');
        
        if (originSize) {
            const w = originSize[0];
            const h = originSize[1];

            if (contextVideo._onlyPercentage || (/%$/.test(w) && (/%$/.test(h) || !/\d/.test(h)))) {
                this.plugins.video.setPercentSize.call(this, w, h);
            } else {
                this.plugins.video.setSize.call(this, w, h);
            }

            // save current size
            this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
        }
    },

    setPercentSize: function (w, h) {
        const contextVideo = this.context.video;
        h = !!h && !/%$/.test(h) && !this.util.getNumber(h, 0) ? this.util.isNumber(h) ? h + '%' : h : this.util.isNumber(h) ? h + contextVideo.sizeUnit : (h || contextVideo._videoRatio);

        contextVideo._container.style.width = this.util.isNumber(w) ? w + '%' : w;
        contextVideo._container.style.height = '';
        contextVideo._cover.style.width = '100%';
        contextVideo._cover.style.height = h;
        contextVideo._cover.style.paddingBottom = h;
        contextVideo._element.style.width = '100%';
        contextVideo._element.style.height = '100%';
        contextVideo._element.style.maxWidth = '';

        if (contextVideo._align === 'center') this.plugins.video.setAlign.call(this, null, null, null, null);
        contextVideo._element.setAttribute('data-percentage', w + ',' + h);

        // save current size
        this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
    },

    cancelPercentAttr: function () {
        const contextVideo = this.context.video;
        
        contextVideo._cover.style.width = '';
        contextVideo._cover.style.height = '';
        contextVideo._cover.style.paddingBottom = '';
        contextVideo._container.style.width = '';
        contextVideo._container.style.height = '';

        this.util.removeClass(contextVideo._container, this.context.video._floatClassRegExp);
        this.util.addClass(contextVideo._container, '__se__float-' + contextVideo._align);

        if (contextVideo._align === 'center') this.plugins.video.setAlign.call(this, null, null, null, null);
    },

    setAlign: function (align, element, cover, container) {
        const contextVideo = this.context.video;
        
        if (!align) align = contextVideo._align;
        if (!element) element = contextVideo._element;
        if (!cover) cover = contextVideo._cover;
        if (!container) container = contextVideo._container;

        if (align && align !== 'none') {
            cover.style.margin = 'auto';
        } else {
            cover.style.margin = '0';
        }

        if (/%$/.test(element.style.width) && align === 'center') {
            container.style.minWidth = '100%';
            cover.style.width = container.style.width;
            cover.style.height = cover.style.paddingBottom;
            cover.style.paddingBottom = this.util.getNumber((this.util.getNumber(cover.style.paddingBottom, 2) / 100) * this.util.getNumber(cover.style.width, 2), 2) + '%';
        } else {
            container.style.minWidth = '';
            cover.style.width = this.context.resizing._rotateVertical ? (element.style.height || element.offsetHeight) : (element.style.width || '100%');
            cover.style.paddingBottom = cover.style.height;
        }

        if (!this.util.hasClass(container, '__se__float-' + align)) {
            this.util.removeClass(container, contextVideo._floatClassRegExp);
            this.util.addClass(container, '__se__float-' + align);
            element.setAttribute('data-align', align);
        }
    },

    resetAlign: function () {
        const contextVideo = this.context.video;

        contextVideo._element.setAttribute('data-align', '');
        contextVideo._align = 'none';
        contextVideo._cover.style.margin = '0';
        this.util.removeClass(contextVideo._container, contextVideo._floatClassRegExp);
    },

    destroy: function () {
        this._variable._videosCnt--;
        this.util.removeItem(this.context.video._container);
        this.plugins.video.init.call(this);
        this.controllersOff();

        // history stack
        this.history.push();
    },

    init: function () {
        const contextVideo = this.context.video;
        contextVideo.focusElement.value = '';
        contextVideo._origin_w = this.context.option.videoWidth;
        contextVideo._origin_h = this.context.option.videoHeight;

        contextVideo.modal.querySelector('input[name="suneditor_video_radio"][value="none"]').checked = true;
        
        if (contextVideo._resizing) {
            contextVideo.inputX.value = this.context.option.videoWidth === contextVideo._defaultSizeX ? '' : this.context.option.videoWidth;
            contextVideo.inputY.value = '';
            contextVideo.proportion.checked = true;
            contextVideo.proportion.disabled = true;
            this.plugins.video.setVideoRatioSelect.call(this, contextVideo._defaultRatio);
        }
    }
};
