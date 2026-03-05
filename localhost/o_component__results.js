// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import {
    o_wsmsg__f_v_crud__indb,
    f_o_wsmsg,
} from './constructors.js';
import { s_db_create, s_db_update } from './runtimedata.js';

let o_component__results = {
    name: 'component-results',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_results',
        a_o: [
            {
                s_tag: 'div',
                class: 'o_results__header',
                innerText: '{{ a_o_entry.length }} model{{ a_o_entry.length === 1 ? "" : "s" }}',
            },
            // hidden native file picker for photography
            {
                s_tag: 'input',
                type: 'file',
                accept: 'image/png,image/jpeg,image/webp',
                style: 'display:none',
                ref: 'photography_file_input',
                'v-on:change': 'f_on_photography_file_change($event)',
            },
            // hidden native file picker for .3mf
            {
                s_tag: 'input',
                type: 'file',
                accept: '.3mf',
                style: 'display:none',
                ref: 'threemf_file_input',
                'v-on:change': 'f_on_threemf_file_change($event)',
            },
            {
                s_tag: 'div',
                class: 'o_results__grid',
                a_o: [
                    {
                        s_tag: 'div',
                        'v-for': '(o_entry, n_idx) in a_o_entry',
                        class: 'o_results__card',
                        a_o: [
                            // 4:3 frame: generated (left) + photography (right)
                            {
                                s_tag: 'div',
                                class: 'o_results__card_frame',
                                a_o: [
                                    // left half: generated image
                                    {
                                        s_tag: 'div',
                                        class: 'o_results__card_frame_half',
                                        'v-on:wheel.prevent': "f_zoom($event, o_entry, 'image')",
                                        'v-on:mousedown.prevent': "f_pan_start($event, o_entry, 'image')",
                                        a_o: [
                                            {
                                                s_tag: 'img',
                                                'v-if': 'o_entry.o_fsnode_image',
                                                ':src': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_image.s_path_absolute)",
                                                ':style': "f_s_crop_style(o_entry, 'image')",
                                                class: 'o_results__card_image_crop',
                                            },
                                            {
                                                s_tag: 'div',
                                                'v-else': '',
                                                class: 'o_results__card_frame_empty',
                                                innerText: 'No image',
                                            },
                                        ],
                                    },
                                    // right half: photography image or select
                                    {
                                        s_tag: 'div',
                                        ':class': "'o_results__card_frame_half' + (o_entry.o_fsnode_photography ? '' : ' o_results__card_frame_half--empty')",
                                        'v-on:wheel.prevent': "o_entry.o_fsnode_photography ? f_zoom($event, o_entry, 'photography') : null",
                                        'v-on:mousedown.prevent': "o_entry.o_fsnode_photography ? f_pan_start($event, o_entry, 'photography') : null",
                                        'v-on:click': "!o_entry.o_fsnode_photography ? f_open_photography_picker(n_idx) : null",
                                        a_o: [
                                            {
                                                s_tag: 'img',
                                                'v-if': 'o_entry.o_fsnode_photography',
                                                ':src': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_photography.s_path_absolute)",
                                                ':style': "f_s_crop_style(o_entry, 'photography')",
                                                class: 'o_results__card_image_crop',
                                            },
                                            {
                                                s_tag: 'div',
                                                'v-else': '',
                                                class: 'o_results__card_frame_empty interactable',
                                                innerText: 'Select photo',
                                            },
                                        ],
                                    },
                                ],
                            },
                            // labels row below the frame
                            {
                                s_tag: 'div',
                                class: 'o_results__card_frame_labels',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_results__card_frame_label',
                                        innerText: 'Generated',
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_results__card_frame_label',
                                        a_o: [
                                            {
                                                s_tag: 'span',
                                                innerText: 'Photography',
                                            },
                                            {
                                                s_tag: 'span',
                                                'v-if': 'o_entry.o_fsnode_photography',
                                                class: 'interactable o_results__card_image_label_change',
                                                'v-on:click': 'f_open_photography_picker(n_idx)',
                                                innerText: 'change',
                                            },
                                        ],
                                    },
                                ],
                            },
                            // thumbnail
                            {
                                s_tag: 'img',
                                'v-if': 'o_entry.o_fsnode_thumbnail',
                                ':src': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_thumbnail.s_path_absolute)",
                                class: 'o_results__card_thumbnail',
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable o_results__card_btn o_results__card_generate_thumb',
                                'v-on:click': 'f_generate_thumbnail(o_entry)',
                                innerText: "{{ o_entry.o_fsnode_thumbnail ? 'Regenerate thumbnail' : 'Generate thumbnail' }}",
                            },
                            // 3D model viewer
                            {
                                s_tag: 'model-viewer',
                                ':src': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_glb.s_path_absolute)",
                                'camera-controls': '',
                                'auto-rotate': '',
                                class: 'o_results__card_model',
                            },
                            // text info
                            {
                                s_tag: 'div',
                                class: 'o_results__card_info',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_entry.s_title',
                                        class: 'o_results__card_title',
                                        innerText: '{{ o_entry.s_title }}',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_entry.s_name',
                                        class: 'o_results__card_name',
                                        innerText: '{{ o_entry.s_name }}',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_entry.s_description',
                                        class: 'o_results__card_description',
                                        innerText: '{{ o_entry.s_description }}',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_entry.s_story',
                                        class: 'o_results__card_story',
                                        innerText: '{{ o_entry.s_story }}',
                                    },
                                ],
                            },
                            // metadata
                            {
                                s_tag: 'div',
                                class: 'o_results__card_meta',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        innerText: "{{ o_entry.s_word }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        innerText: "{{ new Date(o_entry.o_fsnode_glb.n_ts_ms_created).toLocaleString() }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        innerText: "{{ Math.round(o_entry.o_fsnode_glb.n_bytes / 1024) + ' KB' }}",
                                    },
                                ],
                            },
                            // printables data
                            {
                                s_tag: 'div',
                                class: 'o_results__card_printables',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_results__card_printables_header',
                                        innerText: 'Printables Data',
                                    },
                                    {
                                        s_tag: 'div',
                                        ':class': "'interactable o_results__card_btn' + (o_entry.b_uploading_printables ? ' loading' : '')",
                                        'v-on:click': 'f_upload_and_copy_printables(o_entry)',
                                        innerText: "{{ o_entry.b_uploading_printables ? 'Uploading files...' : 'Upload & copy autofill script' }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_entry.a_s_fileslink_url && o_entry.a_s_fileslink_url.length',
                                        class: 'o_results__card_printables_urls',
                                        a_o: [
                                            {
                                                s_tag: 'a',
                                                'v-for': 'o_url in o_entry.a_s_fileslink_url',
                                                ':href': 'o_url.s_url',
                                                target: '_blank',
                                                class: 'o_results__card_printables_url_link',
                                                innerText: "{{ o_url.s_filename }}",
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'pre',
                                        class: 'o_results__card_printables_preview',
                                        innerText: '{{ f_s_printables_snippet_preview(o_entry) }}',
                                    },
                                ],
                            },
                            // downloads
                            {
                                s_tag: 'div',
                                class: 'o_results__card_downloads',
                                a_o: [
                                    {
                                        s_tag: 'a',
                                        ':href': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_glb.s_path_absolute)",
                                        ':download': "o_entry.s_word + '.glb'",
                                        class: 'interactable o_results__card_btn',
                                        innerText: 'GLB',
                                    },
                                    {
                                        s_tag: 'a',
                                        'v-if': 'o_entry.o_fsnode_stl',
                                        ':href': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_stl.s_path_absolute)",
                                        ':download': "o_entry.s_word + '.stl'",
                                        class: 'interactable o_results__card_btn',
                                        innerText: 'STL',
                                    },
                                    {
                                        s_tag: 'a',
                                        'v-if': 'o_entry.o_fsnode_image',
                                        ':href': "'/api/file?path=' + encodeURIComponent(o_entry.o_fsnode_image.s_path_absolute)",
                                        ':download': "o_entry.s_word + '.png'",
                                        class: 'interactable o_results__card_btn',
                                        innerText: 'PNG',
                                    },
                                ],
                            },
                            // cults3d upload section
                            {
                                s_tag: 'div',
                                class: 'o_results__card_cults',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_results__card_cults_header',
                                        innerText: 'Cults3D',
                                    },
                                    // pick .3mf (print profile)
                                    {
                                        s_tag: 'div',
                                        class: 'interactable o_results__card_btn',
                                        'v-on:click': 'f_open_threemf_picker(n_idx)',
                                        innerText: "{{ o_entry.o_file_3mf ? '\\u2713 ' + o_entry.o_file_3mf.name : 'Pick .3mf' }}",
                                    },
                                    // upload button (only if not already uploaded)
                                    {
                                        s_tag: 'div',
                                        'v-if': '!o_entry.o_cults3d_info',
                                        ':class': "'interactable o_results__card_btn o_results__card_cults_upload' + (o_entry.b_uploading_cults3d ? ' loading' : '')",
                                        'v-on:click': 'f_upload_cults3d(o_entry)',
                                        innerText: "{{ o_entry.b_uploading_cults3d ? 'Uploading...' : 'Upload to Cults3D' }}",
                                    },
                                    // uploaded status
                                    {
                                        s_tag: 'a',
                                        'v-if': 'o_entry.o_cults3d_info',
                                        ':href': 'o_entry.o_cults3d_info.s_cults3d_url',
                                        target: '_blank',
                                        class: 'o_results__card_cults_uploaded',
                                        innerText: "{{ '\\u2713 Uploaded' + (o_entry.o_cults3d_info.s_cults3d_url ? ' — view on Cults3D' : '') }}",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            a_o_entry: [],
            n_idx_entry_picking: -1,
            n_idx_entry_picking_3mf: -1,
            // crop cache: { [n_id_fsnode]: { n_zoom, n_pan_x, n_pan_y, n_id_o_image } }
            o_crop: {},
            o_entry_dragging: null,
            s_drag_side: '',
            n_drag_start_x: 0,
            n_drag_start_y: 0,
            n_drag_start_pan_x: 0,
            n_drag_start_pan_y: 0,
            n_drag_container_w: 1,
            n_drag_container_h: 1,
        };
    },
    watch: {
        'o_state.a_o_3dmodel': {
            handler: function() { this.f_build_entries(); },
            deep: true,
        },
        'o_state.a_o_fsnode': {
            handler: function() { this.f_build_entries(); },
            deep: true,
        },
        'o_state.a_o_image': {
            handler: function() { this.f_build_entries(); },
            deep: true,
        },
        'o_state.a_o_fsnode_purpose': {
            handler: function() { this.f_build_entries(); },
            deep: true,
        },
    },
    methods: {
        // --- crop helpers ---
        f_n_crop_key: function(o_entry, s_side) {
            if (s_side === 'image') return o_entry.o_fsnode_image ? o_entry.o_fsnode_image.n_id : null;
            if (s_side === 'photography') return o_entry.o_fsnode_photography ? o_entry.o_fsnode_photography.n_id : null;
            return null;
        },
        f_s_crop_style: function(o_entry, s_side) {
            let n_key = this.f_n_crop_key(o_entry, s_side);
            if (!n_key) return '';
            let o_c = this.o_crop[n_key];
            if (!o_c) return '';
            return 'transform: translate(' + o_c.n_pan_x + '%, ' + o_c.n_pan_y + '%) scale(' + o_c.n_zoom + ')';
        },
        f_zoom: function(o_event, o_entry, s_side) {
            let n_key = this.f_n_crop_key(o_entry, s_side);
            if (!n_key) return;
            let o_c = this.o_crop[n_key];
            if (!o_c) return;
            let n_delta = o_event.deltaY > 0 ? -0.15 : 0.15;
            o_c.n_zoom = Math.max(1, Math.min(10, o_c.n_zoom + n_delta * o_c.n_zoom));
            this.f_clamp_pan(o_c);
            this.o_crop = Object.assign({}, this.o_crop);
            let o_self = this;
            clearTimeout(o_self._n_zoom_timeout);
            o_self._n_zoom_timeout = setTimeout(function() { o_self.f_save_crop(n_key); }, 400);
        },
        f_pan_start: function(o_event, o_entry, s_side) {
            let n_key = this.f_n_crop_key(o_entry, s_side);
            if (!n_key) return;
            let o_c = this.o_crop[n_key];
            if (!o_c || o_c.n_zoom <= 1) return;
            this.o_entry_dragging = o_entry;
            this.s_drag_side = s_side;
            this.n_drag_start_x = o_event.clientX;
            this.n_drag_start_y = o_event.clientY;
            this.n_drag_start_pan_x = o_c.n_pan_x;
            this.n_drag_start_pan_y = o_c.n_pan_y;
            let o_container = o_event.currentTarget;
            this.n_drag_container_w = o_container.offsetWidth;
            this.n_drag_container_h = o_container.offsetHeight;
        },
        f_pan_move: function(o_event) {
            if (!this.o_entry_dragging) return;
            let n_key = this.f_n_crop_key(this.o_entry_dragging, this.s_drag_side);
            if (!n_key) return;
            let o_c = this.o_crop[n_key];
            if (!o_c) return;
            let n_dx = o_event.clientX - this.n_drag_start_x;
            let n_dy = o_event.clientY - this.n_drag_start_y;
            o_c.n_pan_x = this.n_drag_start_pan_x + (n_dx / this.n_drag_container_w) * 100;
            o_c.n_pan_y = this.n_drag_start_pan_y + (n_dy / this.n_drag_container_h) * 100;
            this.f_clamp_pan(o_c);
            this.o_crop = Object.assign({}, this.o_crop);
        },
        f_pan_end: function() {
            if (!this.o_entry_dragging) return;
            let n_key = this.f_n_crop_key(this.o_entry_dragging, this.s_drag_side);
            this.o_entry_dragging = null;
            this.s_drag_side = '';
            if (n_key) this.f_save_crop(n_key);
        },
        f_clamp_pan: function(o_c) {
            let n_max = Math.max(0, (o_c.n_zoom - 1) / o_c.n_zoom * 50);
            o_c.n_pan_x = Math.max(-n_max, Math.min(n_max, o_c.n_pan_x));
            o_c.n_pan_y = Math.max(-n_max, Math.min(n_max, o_c.n_pan_y));
        },
        f_save_crop: async function(n_key) {
            let o_c = this.o_crop[n_key];
            if (!o_c || !o_c.n_id_o_image) return;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_update, 'a_o_image',
                    { n_id: o_c.n_id_o_image },
                    { n_scl_x_crop: o_c.n_zoom, n_scl_y_crop: o_c.n_zoom, n_trn_x_crop: o_c.n_pan_x, n_trn_y_crop: o_c.n_pan_y },
                ])
            );
        },
        // --- photography file picker (native OS dialog) ---
        f_open_photography_picker: function(n_idx) {
            this.n_idx_entry_picking = n_idx;
            this.$refs.photography_file_input.click();
        },
        f_on_photography_file_change: async function(o_event) {
            let o_file = o_event.target.files[0];
            if (!o_file) return;
            let o_entry = this.a_o_entry[this.n_idx_entry_picking];
            if (!o_entry) return;
            let n_id_parent = o_entry.o_fsnode_image ? o_entry.o_fsnode_image.n_id : o_entry.o_fsnode_glb.n_id;
            let o_form = new FormData();
            o_form.append('file', o_file);
            o_form.append('n_o_fsnode_n_id', n_id_parent);
            try {
                let o_resp = await fetch('/api/upload-file', {
                    method: 'POST',
                    body: o_form,
                });
                let o_data = await o_resp.json();
                if (o_data.s_error) throw new Error(o_data.s_error);
                if (o_data.o_fsnode) {
                    let n_id_new = o_data.o_fsnode.n_id;
                    await f_send_wsmsg_with_response(
                        f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_create, 'a_o_fsnode_purpose', {
                            s_text: 'photography',
                            n_o_fsnode_n_id: n_id_new,
                        }])
                    );
                    let o_resp_image = await f_send_wsmsg_with_response(
                        f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_create, 'a_o_image', {
                            n_o_fsnode_n_id: n_id_new,
                            n_scl_x_crop: 1,
                            n_scl_y_crop: 1,
                            n_trn_x_crop: 0,
                            n_trn_y_crop: 0,
                        }])
                    );
                    this.o_crop[n_id_new] = {
                        n_zoom: 1,
                        n_pan_x: 0,
                        n_pan_y: 0,
                        n_id_o_image: o_resp_image.v_result?.n_id,
                    };
                }
            } catch (o_error) {
                console.error('Photography selection failed: ' + o_error.message);
            }
            o_event.target.value = '';
            this.n_idx_entry_picking = -1;
        },
        // --- cults3d upload ---
// --- cults3d upload ---
f_upload_cults3d: async function(o_entry) {
    if (o_entry.b_uploading_cults3d) return;
    o_entry.b_uploading_cults3d = true;
    try {
        globalThis.o_entry = o_entry;
        let s_name = o_entry.s_title || o_entry.s_name || o_entry.s_word || '';
        let s_description = o_entry.s_description || '';
        let a_tags = ['lowpoly', 'polyprints', 'figurines', 'figures'];
        if (o_entry.s_word) a_tags.push(o_entry.s_word);
        let s_tags = a_tags.join(',');

        let o_form = new FormData();
        o_form.append('name', s_name);
        o_form.append('description', s_description);
        o_form.append('tags', s_tags);
        if (o_entry.o_fsnode_thumbnail) {
            o_form.append('path_thumbnail', o_entry.o_fsnode_thumbnail.s_path_absolute);
        }
        if (o_entry.o_fsnode_stl) {
            o_form.append('path_stl', o_entry.o_fsnode_stl.s_path_absolute);
        }
        if (o_entry.o_file_3mf) {
            o_form.append('o_file_3mf', o_entry.o_file_3mf);
        }
        let o_fsnode_parent = o_entry.o_fsnode_image || o_entry.o_fsnode_glb;
        if (!o_fsnode_parent) throw new Error('No image or GLB node found on entry');
        o_form.append('n_o_fsnode_n_id', o_fsnode_parent.n_id);

        let o_resp = await fetch('/api/cults3d-upload', { method: 'POST', body: o_form });
        if (!o_resp.ok) throw new Error(`HTTP ${o_resp.status}: ${await o_resp.text()}`);

        let o_data = await o_resp.json();
        if (o_data.s_error) throw new Error(o_data.s_error);
        o_entry.o_cults3d_info = {
            s_cults3d_id:       o_data.o_creation?.id,
            s_cults3d_url:      o_data.o_creation?.url,
            s_cults3d_name:     o_data.o_creation?.name,
            n_ts_ms_uploaded:   Date.now(),
            s_name:             s_name,
        };
        alert('Uploaded to Cults3D!');
    } catch (o_error) {
        console.error('Cults3D upload failed:', o_error.message);
        alert('Cults3D upload failed: ' + o_error.message);
    } finally {
        o_entry.b_uploading_cults3d = false;
    }
},
        // --- .3mf file picker ---
        f_open_threemf_picker: function(n_idx) {
            this.n_idx_entry_picking_3mf = n_idx;
            this.$refs.threemf_file_input.click();
        },
        f_on_threemf_file_change: function(o_event) {
            let o_file = o_event.target.files[0];
            if (!o_file) return;
            let o_entry = this.a_o_entry[this.n_idx_entry_picking_3mf];
            if (o_entry) {
                o_entry.o_file_3mf = o_file;
            }
            o_event.target.value = '';
            this.n_idx_entry_picking_3mf = -1;
        },
        // --- thumbnail generation ---
        f_generate_thumbnail: function(o_entry) {
            let o_self = this;
            let n_w = 1200;
            let n_h = 900;
            let n_half_w = n_w / 2;
            let a_o_side = [
                { o_fsnode: o_entry.o_fsnode_image, n_x: 0 },
                { o_fsnode: o_entry.o_fsnode_photography, n_x: n_half_w },
            ];
            let o_canvas = document.createElement('canvas');
            o_canvas.width = n_w;
            o_canvas.height = n_h;
            let o_ctx = o_canvas.getContext('2d');
            o_ctx.fillStyle = '#111';
            o_ctx.fillRect(0, 0, n_w, n_h);
            let n_loaded = 0;
            let n_total = a_o_side.filter(function(o) { return o.o_fsnode; }).length;
            if (n_total === 0) return;
            for (let o_side of a_o_side) {
                if (!o_side.o_fsnode) continue;
                let o_img = new Image();
                o_img.crossOrigin = 'anonymous';
                o_img.onload = function() {
                    let o_c = o_self.o_crop[o_side.o_fsnode.n_id] || { n_zoom: 1, n_pan_x: 0, n_pan_y: 0 };
                    // replicate object-fit: cover + transform
                    let n_img_w = o_img.naturalWidth;
                    let n_img_h = o_img.naturalHeight;
                    let n_img_ratio = n_img_w / n_img_h;
                    let n_box_ratio = n_half_w / n_h;
                    let n_draw_w, n_draw_h;
                    if (n_img_ratio > n_box_ratio) {
                        n_draw_h = n_h;
                        n_draw_w = n_h * n_img_ratio;
                    } else {
                        n_draw_w = n_half_w;
                        n_draw_h = n_half_w / n_img_ratio;
                    }
                    // apply zoom
                    n_draw_w *= o_c.n_zoom;
                    n_draw_h *= o_c.n_zoom;
                    // center in the box, then apply pan (percentage of box size)
                    let n_dx = o_side.n_x + (n_half_w - n_draw_w) / 2 + (o_c.n_pan_x / 100) * n_half_w;
                    let n_dy = (n_h - n_draw_h) / 2 + (o_c.n_pan_y / 100) * n_h;
                    o_ctx.save();
                    o_ctx.beginPath();
                    o_ctx.rect(o_side.n_x, 0, n_half_w, n_h);
                    o_ctx.clip();
                    o_ctx.drawImage(o_img, n_dx, n_dy, n_draw_w, n_draw_h);
                    o_ctx.restore();
                    n_loaded++;
                    if (n_loaded === n_total) {
                        o_canvas.toBlob(async function(o_blob) {
                            let s_filename = o_entry.s_word + '_thumbnail.png';
                            let o_file = new File([o_blob], s_filename, { type: 'image/png' });
                            let n_id_parent = o_entry.o_fsnode_image ? o_entry.o_fsnode_image.n_id : o_entry.o_fsnode_glb.n_id;
                            let o_form = new FormData();
                            o_form.append('file', o_file);
                            o_form.append('n_o_fsnode_n_id', n_id_parent);
                            try {
                                let o_resp = await fetch('/api/upload-file', { method: 'POST', body: o_form });
                                let o_data = await o_resp.json();
                                if (o_data.s_error) throw new Error(o_data.s_error);
                                if (o_data.o_fsnode) {
                                    await f_send_wsmsg_with_response(
                                        f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_create, 'a_o_fsnode_purpose', {
                                            s_text: 'thumbnail',
                                            n_o_fsnode_n_id: o_data.o_fsnode.n_id,
                                        }])
                                    );
                                }
                            } catch (o_error) {
                                console.error('Thumbnail upload failed: ' + o_error.message);
                            }
                        }, 'image/png');
                    }
                };
                o_img.src = '/api/file?path=' + encodeURIComponent(o_side.o_fsnode.s_path_absolute);
            }
        },
        // --- printables snippet ---
        f_s_printables_snippet: function(o_entry) {
            let f_esc = function(s) { return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n'); };
            let s_title = f_esc(o_entry.s_title || o_entry.s_word || '');
            let s_name = f_esc(o_entry.s_name || o_entry.s_word || '');
            let s_summary = f_esc('low polygon figurine: ' + (o_entry.s_name || o_entry.s_word || ''));
            let s_description = f_esc(o_entry.s_description || '');
            let s_story = f_esc(o_entry.s_story || '');
            let s_word = f_esc(o_entry.s_word || '');

            // build file URLs list for the snippet
            let a_o_url = o_entry.a_s_fileslink_url || [];
            let s_stl_url = '';
            let s_thumbnail_url = '';
            for (let o_url of a_o_url) {
                if (o_url.s_filename && o_url.s_filename.toLowerCase().endsWith('.stl')) s_stl_url = o_url.s_url;
                if (o_url.s_filename && o_url.s_filename.toLowerCase().endsWith('.png')) s_thumbnail_url = o_url.s_url;
            }
            let s_file_urls_json = JSON.stringify(a_o_url.filter(function(o) { return o.s_url; }));

            return `(() => {
  /* === Printables.com autofill — ${s_word} === */
  function setValue(sel, val) {
    let el = document.querySelector(sel);
    if (!el) { console.warn('NOT FOUND:', sel); return false; }
    let setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function clickRadio(fieldsetSel, labelMatch) {
    let fs = document.querySelector(fieldsetSel);
    if (!fs) { console.warn('NOT FOUND:', fieldsetSel); return false; }
    let labels = fs.querySelectorAll('label');
    for (let lbl of labels) {
      if (lbl.textContent.trim().includes(labelMatch)) {
        let radio = lbl.querySelector('input[type="radio"]');
        if (radio) { radio.click(); return true; }
      }
    }
    console.warn('Radio not found:', labelMatch, 'in', fieldsetSel);
    return false;
  }

  function clickCustomSelect(btnSel, optionText) {
    let btn = document.querySelector(btnSel);
    if (!btn) { console.warn('NOT FOUND:', btnSel); return false; }
    btn.click();
    return new Promise(r => setTimeout(() => {
      let items = document.querySelectorAll('.svelte-1nwnng3 li, [class*="dropdown"] li, [class*="select"] li, [role="option"], [role="listbox"] li');
      for (let item of items) {
        if (item.textContent.trim().includes(optionText)) {
          item.click();
          r(true);
          return;
        }
      }
      console.warn('Option not found:', optionText, '— dropdown may need manual selection');
      console.log('Available options:', [...items].map(i => i.textContent.trim()));
      r(false);
    }, 300));
  }

  function setTags(inputSel, tags) {
    let input = document.querySelector(inputSel);
    if (!input) { console.warn('NOT FOUND:', inputSel); return false; }
    for (let tag of tags) {
      let setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, tag); else input.value = tag;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, bubbles: true }));
    }
    return true;
  }

  function setContentEditable(sel, html) {
    let el = document.querySelector(sel);
    if (!el) { console.warn('NOT FOUND:', sel); return false; }
    el.innerHTML = html;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  /* --- fill fields --- */
  let results = {};
  results['Model name'] = setValue('#f-name-20', '${s_title}');
  results['Summary'] = setValue('#f-summary-21', '${s_summary}');
  results['Authorship'] = clickRadio('#f-authorship-22', 'Original model');
  results['AI Generated'] = clickRadio('#f-aiGenerated-23', 'Yes');
  results['Description'] = setContentEditable('.tiptap.ProseMirror', '${s_description ? "<p>" + s_description + "</p>" : ""}');
  results['Tags'] = setTags('#f-tags-21', ['lowpoly', 'polyprints', 'figurines', 'figures', '${s_word}']);

  /* --- file download URLs (uploaded via files.link) --- */
  let fileUrls = ${s_file_urls_json};

  /* --- custom selects (async — dropdown needs time to open) --- */
  (async () => {
    results['Category'] = await clickCustomSelect('#f-category-22', 'Action Figures');
    results['License'] = await clickCustomSelect('#f-license-51', 'Attribution');

    /* --- log summary --- */
    console.log('%c=== Printables Autofill Results ===', 'color: #8b74ea; font-weight: bold; font-size: 14px');
    for (let [k, v] of Object.entries(results)) {
      console.log(v ? '%c\\u2713 ' + k : '%c\\u2717 ' + k + ' (MANUAL)', v ? 'color: #68d391' : 'color: #fc8181');
    }

    /* --- log all data for manual reference --- */
    console.log('%c=== Full Model Data ===', 'color: #63b3ed; font-weight: bold; font-size: 14px');
    console.log('Word/slug:', '${s_word}');
    console.log('Title:', '${s_title}');
    console.log('Name:', '${s_name}');
    console.log('Summary:', '${s_summary}');
    console.log('Description:', '${s_description}');
    console.log('Story:', '${s_story}');
    console.log('Category: Action Figures & Statues');
    console.log('Tags: lowpoly, polyprints, figurines, figures, ${s_word}');
    console.log('Authorship: Original model — I made it');
    console.log('AI: Yes — AI-assisted creation');
    console.log('License: Creative Commons — Attribution — Share Alike');

    /* --- log file download links --- */
    if (fileUrls.length) {
      console.log('%c=== File Download URLs (files.link) ===', 'color: #ed8936; font-weight: bold; font-size: 14px');
      for (let f of fileUrls) {
        console.log('%c' + f.s_filename + ':', 'color: #ed8936; font-weight: bold', f.s_url);
      }
      console.log('\\nTo download STL for manual upload to Printables:');
      console.log('Open each URL above in a new tab, then drag the downloaded file into the Printables upload area.');
    } else {
      console.log('%c=== No file URLs — upload files first via the polyprints app ===', 'color: #fc8181');
    }
  })();
})();`;
        },
        f_s_printables_snippet_preview: function(o_entry) {
            let s_name = o_entry.s_title || o_entry.s_name || o_entry.s_word || '?';
            let s_urls = '';
            if (o_entry.a_s_fileslink_url && o_entry.a_s_fileslink_url.length) {
                s_urls = '\nFiles: ' + o_entry.a_s_fileslink_url.map(function(o) { return o.s_filename; }).join(', ');
            }
            return 'Autofill: ' + s_name + '\nSummary: low polygon figurine: ' + (o_entry.s_name || o_entry.s_word || '') + '\nTags: lowpoly, polyprints, figurines, figures, ' + (o_entry.s_word || '') + '\nCategory: Action Figures & Statues\nLicense: CC-BY-SA' + s_urls;
        },
        f_upload_and_copy_printables: async function(o_entry) {
            if (o_entry.b_uploading_printables) return;
            o_entry.b_uploading_printables = true;
            try {
                // collect file paths to upload
                let a_s_path = [];
                if (o_entry.o_fsnode_stl) a_s_path.push(o_entry.o_fsnode_stl.s_path_absolute);
                if (o_entry.o_fsnode_thumbnail) a_s_path.push(o_entry.o_fsnode_thumbnail.s_path_absolute);

                if (a_s_path.length) {
                    let o_resp = await fetch('/api/fileslink-upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ a_s_path: a_s_path }),
                    });
                    let o_data = await o_resp.json();
                    if (o_data.s_error) throw new Error(o_data.s_error);
                    o_entry.a_s_fileslink_url = (o_data.a_o_result || []).filter(function(o) { return o.s_url; });
                } else {
                    o_entry.a_s_fileslink_url = [];
                }

                // copy snippet to clipboard
                let s_snippet = this.f_s_printables_snippet(o_entry);
                await navigator.clipboard.writeText(s_snippet);
                alert('Printables autofill script copied to clipboard!' + (o_entry.a_s_fileslink_url.length ? ' (' + o_entry.a_s_fileslink_url.length + ' files uploaded)' : ''));
            } catch (o_error) {
                console.error('Printables upload+copy failed:', o_error.message);
                alert('Error: ' + o_error.message);
            }
            o_entry.b_uploading_printables = false;
        },
        // --- build entries ---
        f_build_entries: function() {
            let o_self = this;
            let a_o_fsnode = o_state.a_o_fsnode || [];
            let a_o_image = o_state.a_o_image || [];
            let a_o_3dmodel = o_state.a_o_3dmodel || [];
            let a_o_purpose = o_state.a_o_fsnode_purpose || [];

            let a_o_entry = [];

            for (let o_3dmodel of a_o_3dmodel) {
                if (o_3dmodel.s_type !== 'glb') continue;

                let o_fsnode_glb = a_o_fsnode.find(function(o) { return o.n_id === o_3dmodel.n_o_fsnode_n_id; });
                if (!o_fsnode_glb) continue;

                let s_name = o_fsnode_glb.s_name;
                let a_s_parts = s_name.replace(/\.glb$/, '').split('_');
                a_s_parts.pop();
                let s_word = a_s_parts.join('_');
                let s_prefix = s_word + '_';

                // find matching image fsnode
                let o_fsnode_image = null;
                for (let o_image of a_o_image) {
                    let o_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_image.n_o_fsnode_n_id; });
                    if (o_fsnode && o_fsnode.s_name.startsWith(s_prefix) && o_fsnode.s_name.endsWith('.png')) {
                        if (!o_fsnode_image || o_fsnode.n_id > o_fsnode_image.n_id) {
                            o_fsnode_image = o_fsnode;
                        }
                    }
                }

                // find matching STL fsnode
                let o_fsnode_stl = null;
                for (let o_model of a_o_3dmodel) {
                    if (o_model.s_type !== 'stl') continue;
                    let o_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_model.n_o_fsnode_n_id; });
                    if (o_fsnode && o_fsnode.s_name.startsWith(s_prefix)) {
                        if (!o_fsnode_stl || o_fsnode.n_id > o_fsnode_stl.n_id) {
                            o_fsnode_stl = o_fsnode;
                        }
                    }
                }

                // find child fsnodes with purposes
                let a_n_id_parent = [];
                if (o_fsnode_image) a_n_id_parent.push(o_fsnode_image.n_id);
                a_n_id_parent.push(o_fsnode_glb.n_id);

                let o_texts = { title: null, name: null, description: null, story: null };
                let o_fsnode_photography = null;
                let o_fsnode_thumbnail = null;
                let o_fsnode_cults3d = null;
                for (let n_id_parent of a_n_id_parent) {
                    let a_o_child = a_o_fsnode.filter(function(o) { return o.n_o_fsnode_n_id === n_id_parent; });
                    for (let o_child of a_o_child) {
                        let o_purpose = a_o_purpose.find(function(o) { return o.n_o_fsnode_n_id === o_child.n_id; });
                        if (o_purpose) {
                            if (o_purpose.s_text === 'photography' && !o_fsnode_photography) {
                                o_fsnode_photography = o_child;
                            }
                            if (o_purpose.s_text === 'thumbnail' && !o_fsnode_thumbnail) {
                                o_fsnode_thumbnail = o_child;
                            }
                            if (o_purpose.s_text === 'cults3d' && !o_fsnode_cults3d) {
                                o_fsnode_cults3d = o_child;
                            }
                            if (o_texts.hasOwnProperty(o_purpose.s_text) && !o_texts[o_purpose.s_text]) {
                                o_texts[o_purpose.s_text] = o_child.s_path_absolute;
                            }
                        }
                    }
                }

                // populate crop cache for generated image
                if (o_fsnode_image && !o_self.o_crop[o_fsnode_image.n_id]) {
                    let o_image_gen = a_o_image.find(function(o) { return o.n_o_fsnode_n_id === o_fsnode_image.n_id; });
                    o_self.o_crop[o_fsnode_image.n_id] = {
                        n_zoom: o_image_gen ? (o_image_gen.n_scl_x_crop || 1) : 1,
                        n_pan_x: o_image_gen ? (o_image_gen.n_trn_x_crop || 0) : 0,
                        n_pan_y: o_image_gen ? (o_image_gen.n_trn_y_crop || 0) : 0,
                        n_id_o_image: o_image_gen ? o_image_gen.n_id : null,
                    };
                }

                // populate crop cache for photography
                if (o_fsnode_photography && !o_self.o_crop[o_fsnode_photography.n_id]) {
                    let o_image_photo = a_o_image.find(function(o) { return o.n_o_fsnode_n_id === o_fsnode_photography.n_id; });
                    o_self.o_crop[o_fsnode_photography.n_id] = {
                        n_zoom: o_image_photo ? (o_image_photo.n_scl_x_crop || 1) : 1,
                        n_pan_x: o_image_photo ? (o_image_photo.n_trn_x_crop || 0) : 0,
                        n_pan_y: o_image_photo ? (o_image_photo.n_trn_y_crop || 0) : 0,
                        n_id_o_image: o_image_photo ? o_image_photo.n_id : null,
                    };
                }

                // preserve previously picked .3mf file across rebuilds
                let o_prev = o_self.a_o_entry.find(function(o) { return o.o_fsnode_glb.n_id === o_fsnode_glb.n_id; });

                let o_entry = {
                    o_3dmodel: o_3dmodel,
                    o_fsnode_glb: o_fsnode_glb,
                    o_fsnode_image: o_fsnode_image,
                    o_fsnode_stl: o_fsnode_stl,
                    o_fsnode_photography: o_fsnode_photography,
                    o_fsnode_thumbnail: o_fsnode_thumbnail,
                    o_fsnode_cults3d: o_fsnode_cults3d,
                    o_cults3d_info: null,
                    s_word: s_word,
                    s_title: null,
                    s_name: null,
                    s_description: null,
                    s_story: null,
                    o_file_3mf: o_prev ? o_prev.o_file_3mf : null,
                    b_uploading_cults3d: false,
                    b_uploading_printables: false,
                    a_s_fileslink_url: o_prev ? o_prev.a_s_fileslink_url : null,
                };

                let a_s_field = [
                    ['title', 's_title'],
                    ['name', 's_name'],
                    ['description', 's_description'],
                    ['story', 's_story'],
                ];
                for (let a_pair of a_s_field) {
                    let s_path = o_texts[a_pair[0]];
                    if (s_path) {
                        (function(o_target, s_field) {
                            fetch('/api/file?path=' + encodeURIComponent(s_path))
                                .then(function(o_resp) { return o_resp.text(); })
                                .then(function(s_text) { o_target[s_field] = s_text; });
                        })(o_entry, a_pair[1]);
                    }
                }

                // load cults3d upload info if exists
                if (o_fsnode_cults3d) {
                    (function(o_target) {
                        fetch('/api/file?path=' + encodeURIComponent(o_fsnode_cults3d.s_path_absolute))
                            .then(function(o_resp) { return o_resp.text(); })
                            .then(function(s_text) {
                                try { o_target.o_cults3d_info = JSON.parse(s_text); } catch {}
                            });
                    })(o_entry);
                }

                a_o_entry.push(o_entry);
            }

            a_o_entry.sort(function(a, b) {
                return b.o_fsnode_glb.n_ts_ms_created - a.o_fsnode_glb.n_ts_ms_created;
            });

            // update dragging reference to new entry object
            if (o_self.o_entry_dragging) {
                let n_drag_key = o_self.f_n_crop_key(o_self.o_entry_dragging, o_self.s_drag_side);
                if (n_drag_key) {
                    let o_new = a_o_entry.find(function(o) {
                        let n_k = o_self.s_drag_side === 'image'
                            ? (o.o_fsnode_image ? o.o_fsnode_image.n_id : null)
                            : (o.o_fsnode_photography ? o.o_fsnode_photography.n_id : null);
                        return n_k === n_drag_key;
                    });
                    if (o_new) o_self.o_entry_dragging = o_new;
                }
            }

            o_self.a_o_entry = a_o_entry;
        },
    },
    mounted: function() {
        let o_self = this;
        this._f_pan_move = function(o_event) { o_self.f_pan_move(o_event); };
        this._f_pan_end = function() { o_self.f_pan_end(); };
        document.addEventListener('mousemove', this._f_pan_move);
        document.addEventListener('mouseup', this._f_pan_end);
    },
    beforeUnmount: function() {
        document.removeEventListener('mousemove', this._f_pan_move);
        document.removeEventListener('mouseup', this._f_pan_end);
    },
    created: function() {
        this.f_build_entries();
    },
};

export { o_component__results };
