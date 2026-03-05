// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import {
    o_wsmsg__f_v_crud__indb,
    f_o_wsmsg,
} from './constructors.js';
import { s_db_create, s_db_delete } from './runtimedata.js';

let o_component__generatedata = {
    name: 'component-generatedata',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_generatedata',
        a_o: [
            {
                class: 'o_generatedata__controls',
                a_o: [
                    // prompt selector from database
                    {
                        s_tag: 'div',
                        class: 'o_generatedata__field',
                        a_o: [
                            {
                                s_tag: 'label',
                                innerText: 'Prompt preset',
                            },
                            {
                                s_tag: 'select',
                                'v-model': 'n_id_prompt_selected',
                                'v-on:change': 'f_on_prompt_selected',
                                a_o: [
                                    {
                                        s_tag: 'option',
                                        ':value': 'null',
                                        innerText: '— select a prompt —',
                                    },
                                    {
                                        s_tag: 'option',
                                        'v-for': 'o_prompt in o_state.a_o_imagegeneratorprompt || []',
                                        ':value': 'o_prompt.n_id',
                                        innerText: '{{ o_prompt.s_label }}',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_generatedata__field',
                        a_o: [
                            {
                                s_tag: 'label',
                                innerText: 'Prompt template ([s] will be replaced with each word)',
                            },
                            {
                                s_tag: 'textarea',
                                'v-model': 's_prompt',
                                rows: '4',
                                placeholder: 'Enter prompt template...',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_generatedata__field',
                        a_o: [
                            {
                                s_tag: 'label',
                                innerText: 'Words (comma-separated)',
                            },
                            {
                                s_tag: 'textarea',
                                'v-model': 's_words',
                                rows: '3',
                                placeholder: 'cat, fox, elephant, ...',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_generatedata__actions',
                        a_o: [
                            {
                                s_tag: 'div',
                                ':class': "'interactable o_generatedata__btn' + (b_generating ? ' disabled' : '')",
                                'v-on:click': 'f_generate',
                                innerText: "{{ b_generating ? 'Generating...' : 'Generate' }}",
                            },
                            {
                                s_tag: 'div',
                                'v-if': 'b_generating',
                                class: 'o_generatedata__progress',
                                innerText: "{{ s_status }}",
                            },
                        ],
                    },
                ],
            },
            // prompt preview tiles — shown when a preset is selected and words are entered
            {
                s_tag: 'div',
                class: 'o_generatedata__prompt_tiles',
                'v-if': 's_prompt && s_words && !b_generating',
                a_o: [
                    {
                        s_tag: 'label',
                        class: 'o_generatedata__prompt_tiles_label',
                        innerText: 'Prompts',
                    },
                    {
                        s_tag: 'div',
                        class: 'o_generatedata__prompt_tiles_grid',
                        a_o: [
                            {
                                s_tag: 'div',
                                'v-for': 's_word in a_s_word_parsed',
                                class: 'o_generatedata__prompt_tile',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_generatedata__prompt_tile_word',
                                        innerText: '{{ s_word }}',
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_generatedata__prompt_tile_text',
                                        innerText: "{{ s_prompt.replace(/\\[s\\]/g, s_word) }}",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                s_tag: 'div',
                class: 'o_generatedata__results',
                'v-if': 'a_o_result.length > 0',
                a_o: [
                    {
                        s_tag: 'div',
                        'v-for': '(o_result, n_idx) in a_o_result',
                        class: 'o_generatedata__result',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_generatedata__result_header',
                                innerText: "{{ (n_idx + 1) + '. ' + o_result.s_word }}",
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generatedata__result_prompt',
                                innerText: "{{ o_result.s_prompt_resolved }}",
                            },
                            // loading spinner for image
                            {
                                s_tag: 'div',
                                'v-if': "o_result.s_status === 'generating_image'",
                                class: 'o_generatedata__loading',
                                a_o: [
                                    { s_tag: 'div', class: 'o_spinner' },
                                    { s_tag: 'span', innerText: 'Generating image...' },
                                ],
                            },
                            // generated image
                            {
                                s_tag: 'img',
                                'v-if': 'o_result.s_path_image',
                                ':src': "'/api/file?path=' + encodeURIComponent(o_result.s_path_image)",
                                class: 'o_generatedata__image',
                            },
                            // loading spinner for model
                            {
                                s_tag: 'div',
                                'v-if': "o_result.s_status === 'generating_model'",
                                class: 'o_generatedata__loading',
                                a_o: [
                                    { s_tag: 'div', class: 'o_spinner' },
                                    { s_tag: 'span', innerText: 'Generating 3D model...' },
                                ],
                            },
                            // 3D model viewer
                            {
                                s_tag: 'model-viewer',
                                'v-if': 'o_result.s_path_model',
                                ':src': "'/api/file?path=' + encodeURIComponent(o_result.s_path_model)",
                                'camera-controls': '',
                                'auto-rotate': '',
                                class: 'o_generatedata__model',
                            },
                            // download actions
                            {
                                s_tag: 'div',
                                'v-if': "o_result.s_path_model && o_result.s_status === 'done'",
                                class: 'o_generatedata__downloads',
                                a_o: [
                                    {
                                        s_tag: 'a',
                                        ':href': "'/api/file?path=' + encodeURIComponent(o_result.s_path_model)",
                                        ':download': "o_result.s_word + '.glb'",
                                        class: 'interactable o_generatedata__btn_small',
                                        innerText: 'Download GLB',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.b_converting_stl',
                                        class: 'o_generatedata__loading',
                                        a_o: [
                                            { s_tag: 'div', class: 'o_spinner' },
                                            { s_tag: 'span', innerText: 'Converting to STL...' },
                                        ],
                                    },
                                    {
                                        s_tag: 'a',
                                        'v-if': 'o_result.s_path_stl',
                                        ':href': "'/api/file?path=' + encodeURIComponent(o_result.s_path_stl)",
                                        ':download': "o_result.s_word + '.stl'",
                                        class: 'interactable o_generatedata__btn_small',
                                        innerText: 'Download STL',
                                    },
                                ],
                            },
                            // text from image loading
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.b_generating_text_from_image',
                                class: 'o_generatedata__loading',
                                a_o: [
                                    { s_tag: 'div', class: 'o_spinner' },
                                    { s_tag: 'span', innerText: 'Generating text from image...' },
                                ],
                            },
                            // text from image display
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.s_text_from_image',
                                class: 'o_generatedata__text_from_image',
                                innerText: "{{ o_result.s_text_from_image }}",
                            },
                            // text generation loading
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.b_generating_text',
                                class: 'o_generatedata__loading',
                                a_o: [
                                    { s_tag: 'div', class: 'o_spinner' },
                                    { s_tag: 'span', innerText: 'Generating title & description...' },
                                ],
                            },
                            // title, name, description, story display
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.s_title || o_result.s_name || o_result.s_description || o_result.s_story',
                                class: 'o_generatedata__text_info',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_title',
                                        class: 'o_generatedata__title',
                                        innerText: "{{ o_result.s_title }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_name',
                                        class: 'o_generatedata__name',
                                        innerText: "{{ o_result.s_name }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_description',
                                        class: 'o_generatedata__description',
                                        innerText: "{{ o_result.s_description }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_story',
                                        class: 'o_generatedata__story',
                                        innerText: "{{ o_result.s_story }}",
                                    },
                                ],
                            },
                            // generate text button — shown when model exists but no text yet
                            {
                                s_tag: 'div',
                                'v-if': "(o_result.n_id_fsnode_image || o_result.n_id_fsnode_model) && o_result.s_status === 'done' && !o_result.s_title && !o_result.s_name && !o_result.s_description && !o_result.s_story && !o_result.b_generating_text_from_image && !o_result.b_generating_text",
                                class: 'interactable o_generatedata__btn',
                                'v-on:click': 'f_generate_text_for_result(o_result)',
                                innerText: 'Generate text',
                            },
                            // file paths
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.s_path_image || o_result.s_path_model',
                                class: 'o_generatedata__filepaths',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_path_image',
                                        innerText: "{{ 'Image: ' + o_result.s_path_image }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_path_model',
                                        innerText: "{{ 'Model: ' + o_result.s_path_model }}",
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_result.s_path_stl',
                                        innerText: "{{ 'STL: ' + o_result.s_path_stl }}",
                                    },
                                ],
                            },
                            // error
                            {
                                s_tag: 'div',
                                'v-if': 'o_result.s_error',
                                class: 'o_generatedata__error',
                                innerText: "{{ o_result.s_error }}",
                            },
                            // attachments section — upload files and assign purposes
                            {
                                s_tag: 'div',
                                'v-if': "(o_result.n_id_fsnode_image || o_result.n_id_fsnode_model) && o_result.s_status === 'done'",
                                class: 'o_generatedata__attachments',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_generatedata__attachments_header',
                                        innerText: 'Attachments',
                                    },
                                    // list of attached files (child fsnodes)
                                    {
                                        s_tag: 'div',
                                        'v-for': 'o_child in f_a_o_fsnode__children(o_result)',
                                        class: 'o_generatedata__attachment_item',
                                        a_o: [
                                            {
                                                s_tag: 'a',
                                                ':href': "'/api/file?path=' + encodeURIComponent(o_child.s_path_absolute)",
                                                ':download': 'o_child.s_name',
                                                class: 'o_generatedata__attachment_name',
                                                innerText: '{{ o_child.s_name }}',
                                            },
                                            {
                                                s_tag: 'span',
                                                class: 'o_generatedata__attachment_size',
                                                innerText: "{{ '(' + Math.round(o_child.n_bytes / 1024) + ' KB)' }}",
                                            },
                                            // purpose display / selector
                                            {
                                                s_tag: 'select',
                                                ':value': 'f_s_purpose_for_fsnode(o_child.n_id)',
                                                'v-on:change': 'f_assign_purpose($event, o_child)',
                                                class: 'o_generatedata__purpose_select',
                                                a_o: [
                                                    { s_tag: 'option', value: '', innerText: '— purpose —' },
                                                    {
                                                        s_tag: 'option',
                                                        'v-for': 's_purpose in a_s_purpose_available',
                                                        ':value': 's_purpose',
                                                        innerText: '{{ s_purpose }}',
                                                    },
                                                ],
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_generatedata__btn_small',
                                                'v-on:click': 'f_delete_attachment(o_child)',
                                                innerText: 'x',
                                            },
                                        ],
                                    },
                                    // upload input
                                    {
                                        s_tag: 'div',
                                        class: 'o_generatedata__upload',
                                        a_o: [
                                            {
                                                s_tag: 'input',
                                                type: 'file',
                                                'v-on:change': 'f_upload_file($event, o_result)',
                                            },
                                        ],
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
            n_id_prompt_selected: null,
            s_prompt: '',
            s_words: '',
            b_generating: false,
            s_status: '',
            a_o_result: [],
            n_done: 0,
        };
    },
    computed: {
        a_s_word_parsed: function() {
            return this.s_words
                .split(',')
                .map(function(s) { return s.trim(); })
                .filter(function(s) { return s !== ''; });
        },
        a_s_purpose_available: function() {
            // collect distinct purpose texts from o_fsnode_purpose records that have no fsnode linked (the label definitions)
            let a_o_purpose = o_state.a_o_fsnode_purpose || [];
            let a_s = [];
            for (let o of a_o_purpose) {
                if (a_s.indexOf(o.s_text) === -1) {
                    a_s.push(o.s_text);
                }
            }
            return a_s;
        },
    },
    watch: {
        'o_state.a_o_imagegeneratorprompt': function(a_new) {
            if (a_new && a_new.length > 0 && this.n_id_prompt_selected === null) {
                this.n_id_prompt_selected = a_new[0].n_id;
                this.f_on_prompt_selected();
            }
        },
    },
    methods: {
        f_s_sanitize_word: function(s_word) {
            return s_word.replace(/[^a-zA-Z0-9]/g, '_');
        },
        f_a_s_subject_for_prompt: function(n_id_prompt) {
            let a_o_junction = (o_state.a_o_imagegeneratorprompt_o_imagegeneratorsubject || []);
            let a_n_id_subject = a_o_junction
                .filter(function(o) { return o.n_o_imagegeneratorprompt_n_id === n_id_prompt; })
                .map(function(o) { return o.n_o_imagegeneratorsubject_n_id; });
            let a_o_subject = (o_state.a_o_imagegeneratorsubject || []);
            return a_n_id_subject.map(function(n_id) {
                let o_subject = a_o_subject.find(function(o) { return o.n_id === n_id; });
                return o_subject ? o_subject.s_name : '';
            }).filter(function(s) { return s !== ''; });
        },
        f_a_o_fsnode__children: function(o_result) {
            let a_o_fsnode = o_state.a_o_fsnode || [];
            let a_n_id_parent = [];
            if (o_result.n_id_fsnode_image) a_n_id_parent.push(o_result.n_id_fsnode_image);
            if (o_result.n_id_fsnode_model) a_n_id_parent.push(o_result.n_id_fsnode_model);
            if (a_n_id_parent.length === 0) return [];
            return a_o_fsnode.filter(function(o) {
                return a_n_id_parent.indexOf(o.n_o_fsnode_n_id) !== -1;
            });
        },
        f_s_purpose_for_fsnode: function(n_id_fsnode) {
            let a_o_purpose = o_state.a_o_fsnode_purpose || [];
            let o_purpose = a_o_purpose.find(function(o) {
                return o.n_o_fsnode_n_id === n_id_fsnode;
            });
            return o_purpose ? o_purpose.s_text : '';
        },
        f_on_prompt_selected: function() {
            let o_self = this;
            if (o_self.n_id_prompt_selected === null) return;
            let a_o_prompt = o_state.a_o_imagegeneratorprompt || [];
            let o_prompt = a_o_prompt.find(function(o) { return o.n_id === o_self.n_id_prompt_selected; });
            if (!o_prompt) return;
            o_self.s_prompt = o_prompt.s_prompt_template;
            let a_s_subject = o_self.f_a_s_subject_for_prompt(o_prompt.n_id);
            o_self.s_words = a_s_subject.join(', ');
            o_self.f_load_existing_data();
        },
        f_load_existing_data: function() {
            let o_self = this;
            let a_s_word = o_self.s_words
                .split(',')
                .map(function(s) { return s.trim(); })
                .filter(function(s) { return s !== ''; });

            let a_o_fsnode = o_state.a_o_fsnode || [];
            let a_o_image = o_state.a_o_image || [];
            let a_o_3dmodel = o_state.a_o_3dmodel || [];

            o_self.a_o_result = [];

            for (let s_word of a_s_word) {
                let s_prefix = o_self.f_s_sanitize_word(s_word) + '_';

                let o_fsnode_image = null;
                for (let o_image of a_o_image) {
                    let o_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_image.n_o_fsnode_n_id; });
                    if (o_fsnode && o_fsnode.s_name.startsWith(s_prefix) && o_fsnode.s_name.endsWith('.png')) {
                        if (!o_fsnode_image || o_fsnode.n_id > o_fsnode_image.n_id) {
                            o_fsnode_image = o_fsnode;
                        }
                    }
                }

                let o_fsnode_glb = null;
                let o_fsnode_stl = null;
                for (let o_model of a_o_3dmodel) {
                    let o_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_model.n_o_fsnode_n_id; });
                    if (o_fsnode && o_fsnode.s_name.startsWith(s_prefix)) {
                        if (o_model.s_type === 'glb' && (!o_fsnode_glb || o_fsnode.n_id > o_fsnode_glb.n_id)) {
                            o_fsnode_glb = o_fsnode;
                        }
                        if (o_model.s_type === 'stl' && (!o_fsnode_stl || o_fsnode.n_id > o_fsnode_stl.n_id)) {
                            o_fsnode_stl = o_fsnode;
                        }
                    }
                }

                if (!o_fsnode_image && !o_fsnode_glb) continue;

                // look for existing text files from child fsnodes with purposes
                // text files can be children of image fsnode (new order) or model fsnode (legacy)
                let o_path_by_purpose = { text_from_image: null, title: null, name: null, description: null, story: null };
                let a_o_purpose = o_state.a_o_fsnode_purpose || [];
                let a_n_id_parent = [];
                if (o_fsnode_image) a_n_id_parent.push(o_fsnode_image.n_id);
                if (o_fsnode_glb) a_n_id_parent.push(o_fsnode_glb.n_id);
                for (let n_id_parent of a_n_id_parent) {
                    let a_o_child = a_o_fsnode.filter(function(o) { return o.n_o_fsnode_n_id === n_id_parent; });
                    for (let o_child of a_o_child) {
                        let o_purpose = a_o_purpose.find(function(o) { return o.n_o_fsnode_n_id === o_child.n_id; });
                        if (o_purpose && o_path_by_purpose.hasOwnProperty(o_purpose.s_text) && !o_path_by_purpose[o_purpose.s_text]) {
                            o_path_by_purpose[o_purpose.s_text] = o_child.s_path_absolute;
                        }
                    }
                }

                let o_result = {
                    s_word: s_word,
                    s_prompt_resolved: o_self.s_prompt.replace(/\[s\]/g, s_word),
                    s_status: 'done',
                    s_path_image: o_fsnode_image ? o_fsnode_image.s_path_absolute : null,
                    s_url_image: null,
                    n_id_fsnode_image: o_fsnode_image ? o_fsnode_image.n_id : null,
                    s_path_model: o_fsnode_glb ? o_fsnode_glb.s_path_absolute : null,
                    s_path_stl: o_fsnode_stl ? o_fsnode_stl.s_path_absolute : null,
                    n_id_fsnode_model: o_fsnode_glb ? o_fsnode_glb.n_id : null,
                    b_converting_stl: false,
                    b_generating_text_from_image: false,
                    b_generating_text: false,
                    s_text_from_image: null,
                    s_title: null,
                    s_name: null,
                    s_description: null,
                    s_story: null,
                    s_error: null,
                };

                // load text contents asynchronously for each purpose
                let a_s_purpose_to_field = [
                    ['text_from_image', 's_text_from_image'],
                    ['title', 's_title'],
                    ['name', 's_name'],
                    ['description', 's_description'],
                    ['story', 's_story'],
                ];
                for (let a_pair of a_s_purpose_to_field) {
                    let s_path_text = o_path_by_purpose[a_pair[0]];
                    if (s_path_text) {
                        (function(s_field) {
                            fetch('/api/file?path=' + encodeURIComponent(s_path_text))
                                .then(function(o_resp) { return o_resp.text(); })
                                .then(function(s_text) { o_result[s_field] = s_text; });
                        })(a_pair[1]);
                    }
                }
                o_self.a_o_result.push(o_result);

                if (o_result.s_path_model && !o_result.s_path_stl) {
                    o_self.f_convert_stl(o_result);
                }
            }
        },
        f_convert_stl: async function(o_result) {
            if (o_result.b_converting_stl || o_result.s_path_stl || !o_result.s_path_model) return;
            o_result.b_converting_stl = true;
            try {
                let o_resp = await fetch('/api/convert-stl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s_path_glb: o_result.s_path_model }),
                });
                let o_data = await o_resp.json();
                if (o_data.s_error) throw new Error(o_data.s_error);
                o_result.s_path_stl = o_data.s_path_stl;
            } catch (o_error) {
                o_result.s_error = 'STL conversion failed: ' + o_error.message;
            } finally {
                o_result.b_converting_stl = false;
            }
        },
        f_upload_file: async function(o_event, o_result) {
            let o_file = o_event.target.files[0];
            let n_id_parent = o_result.n_id_fsnode_model || o_result.n_id_fsnode_image;
            if (!o_file || !n_id_parent) return;
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
            } catch (o_error) {
                o_result.s_error = 'Upload failed: ' + o_error.message;
            }
            o_event.target.value = '';
        },
        f_assign_purpose: async function(o_event, o_child_fsnode) {
            let s_purpose = o_event.target.value;
            let a_o_purpose = o_state.a_o_fsnode_purpose || [];
            // remove existing purpose for this fsnode
            let o_existing = a_o_purpose.find(function(o) {
                return o.n_o_fsnode_n_id === o_child_fsnode.n_id;
            });
            if (o_existing) {
                await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_delete, 'a_o_fsnode_purpose', o_existing])
                );
            }
            if (!s_purpose) return;
            // create new purpose record linked to this fsnode
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_create, 'a_o_fsnode_purpose', {
                    s_text: s_purpose,
                    n_o_fsnode_n_id: o_child_fsnode.n_id,
                }])
            );
        },
        f_delete_attachment: async function(o_child_fsnode) {
            // remove any purpose linked to this fsnode
            let a_o_purpose = o_state.a_o_fsnode_purpose || [];
            let o_purpose = a_o_purpose.find(function(o) {
                return o.n_o_fsnode_n_id === o_child_fsnode.n_id;
            });
            if (o_purpose) {
                await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_delete, 'a_o_fsnode_purpose', o_purpose])
                );
            }
            // delete the fsnode record
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_delete, 'a_o_fsnode', o_child_fsnode])
            );
        },
        f_generate_text_for_result: async function(o_result) {
            let n_id_parent = o_result.n_id_fsnode_image || o_result.n_id_fsnode_model;
            if (o_result.b_generating_text_from_image || o_result.b_generating_text || !n_id_parent) return;
            o_result.s_error = null;

            // step 1: generate text_from_image via VLM if not already available
            if (!o_result.s_text_from_image) {
                o_result.b_generating_text_from_image = true;
                try {
                    let o_resp_vlm = await fetch('/api/generate-text-from-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            s_path_image: o_result.s_path_image,
                            s_word: o_result.s_word,
                            n_o_fsnode_n_id: n_id_parent,
                        }),
                    });
                    let o_data_vlm = await o_resp_vlm.json();
                    if (o_data_vlm.s_error) throw new Error(o_data_vlm.s_error);
                    o_result.s_text_from_image = o_data_vlm.s_text_from_image;
                } catch (o_error) {
                    o_result.s_error = 'Text from image generation failed: ' + o_error.message;
                    o_result.b_generating_text_from_image = false;
                    return;
                }
                o_result.b_generating_text_from_image = false;
            }

            // step 2: generate title/name/description/story via LLM
            o_result.b_generating_text = true;
            try {
                let o_resp = await fetch('/api/generate-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        s_prompt_original: o_result.s_prompt_resolved,
                        s_text_from_image: o_result.s_text_from_image,
                        s_word: o_result.s_word,
                        n_o_fsnode_n_id: n_id_parent,
                    }),
                });
                let o_data = await o_resp.json();
                if (o_data.s_error) throw new Error(o_data.s_error);
                o_result.s_title = o_data.s_title;
                o_result.s_name = o_data.s_name;
                o_result.s_description = o_data.s_description;
                o_result.s_story = o_data.s_story;
            } catch (o_error) {
                o_result.s_error = 'Text generation failed: ' + o_error.message;
            }
            o_result.b_generating_text = false;
        },
        f_b_word_has_model: function(s_word) {
            let o_self = this;
            let s_prefix = o_self.f_s_sanitize_word(s_word) + '_';
            let a_o_fsnode = o_state.a_o_fsnode || [];
            let a_o_3dmodel = o_state.a_o_3dmodel || [];
            for (let o_model of a_o_3dmodel) {
                let o_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_model.n_o_fsnode_n_id; });
                if (o_fsnode && o_fsnode.s_name.startsWith(s_prefix) && o_model.s_type === 'glb') {
                    return true;
                }
            }
            return false;
        },
        f_generate: async function() {
            let o_self = this;
            if (o_self.b_generating) return;

            let a_s_word = o_self.s_words
                .split(',')
                .map(function(s) { return s.trim(); })
                .filter(function(s) { return s !== ''; });

            // skip words that already have a 3D model
            a_s_word = a_s_word.filter(function(s_word) {
                return !o_self.f_b_word_has_model(s_word);
            });

            if (a_s_word.length === 0) {
                o_self.s_status = 'All subjects already have models';
                return;
            }

            o_self.b_generating = true;
            o_self.n_done = 0;
            o_self.s_status = 'Generating ' + a_s_word.length + ' subjects in parallel...';

            // create all result objects upfront
            let a_o_task = a_s_word.map(function(s_word) {
                let s_prompt_resolved = o_self.s_prompt.replace(/\[s\]/g, s_word);
                let o_result = {
                    s_word: s_word,
                    s_prompt_resolved: s_prompt_resolved,
                    s_status: 'generating_image',
                    s_path_image: null,
                    s_url_image: null,
                    n_id_fsnode_image: null,
                    s_path_model: null,
                    s_path_stl: null,
                    n_id_fsnode_model: null,
                    b_converting_stl: false,
                    b_generating_text_from_image: false,
                    b_generating_text: false,
                    s_text_from_image: null,
                    s_title: null,
                    s_name: null,
                    s_description: null,
                    s_story: null,
                    s_error: null,
                };
                o_self.a_o_result.push(o_result);
                return { s_word: s_word, s_prompt_resolved: s_prompt_resolved, o_result: o_result };
            });

            // run all generation chains in parallel
            await Promise.all(a_o_task.map(function(o_task) {
                return o_self.f_generate_one(o_task.s_word, o_task.s_prompt_resolved, o_task.o_result, a_s_word.length);
            }));

            o_self.b_generating = false;
            o_self.s_status = 'Done!';
        },
        f_generate_one: async function(s_word, s_prompt_resolved, o_result, n_total) {
            let o_self = this;
            let s_folder_name = o_self.f_s_sanitize_word(s_word) + '_' + Date.now();

            // 1. generate image
            try {
                let o_resp = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s_prompt: s_prompt_resolved, s_word: s_word, s_folder_name: s_folder_name }),
                });
                let o_data = await o_resp.json();
                if (o_data.s_error) throw new Error(o_data.s_error);
                o_result.s_path_image = o_data.s_path_image;
                o_result.s_url_image = o_data.s_url_image;
                o_result.n_id_fsnode_image = o_data.n_id_fsnode;
            } catch (o_error) {
                o_result.s_error = 'Image generation failed: ' + o_error.message;
                o_result.s_status = 'error';
                o_self.n_done++;
                o_self.s_status = o_self.n_done + '/' + n_total + ' done';
                return;
            }

            // 2. generate text_from_image via VLM
            o_result.s_status = 'generating_text_from_image';
            o_result.b_generating_text_from_image = true;
            try {
                let o_resp_vlm = await fetch('/api/generate-text-from-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        s_path_image: o_result.s_path_image,
                        s_word: s_word,
                        n_o_fsnode_n_id: o_result.n_id_fsnode_image,
                        s_folder_name: s_folder_name,
                    }),
                });
                let o_data_vlm = await o_resp_vlm.json();
                if (o_data_vlm.s_error) throw new Error(o_data_vlm.s_error);
                o_result.s_text_from_image = o_data_vlm.s_text_from_image;
            } catch (o_error) {
                o_result.s_error = 'Text from image generation failed: ' + o_error.message;
                o_result.b_generating_text_from_image = false;
                o_result.s_status = 'error';
                o_self.n_done++;
                o_self.s_status = o_self.n_done + '/' + n_total + ' done';
                return;
            }
            o_result.b_generating_text_from_image = false;

            // 3. generate title, name, description, story text files via LLM
            o_result.s_status = 'generating_text';
            o_result.b_generating_text = true;
            try {
                let o_resp_text = await fetch('/api/generate-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        s_prompt_original: s_prompt_resolved,
                        s_text_from_image: o_result.s_text_from_image,
                        s_word: s_word,
                        n_o_fsnode_n_id: o_result.n_id_fsnode_image,
                        s_folder_name: s_folder_name,
                    }),
                });
                let o_data_text = await o_resp_text.json();
                if (o_data_text.s_error) throw new Error(o_data_text.s_error);
                o_result.s_title = o_data_text.s_title;
                o_result.s_name = o_data_text.s_name;
                o_result.s_description = o_data_text.s_description;
                o_result.s_story = o_data_text.s_story;
            } catch (o_error) {
                o_result.s_error = 'Text generation failed: ' + o_error.message;
            }
            o_result.b_generating_text = false;

            // 4. generate 3D model
            o_result.s_status = 'generating_model';
            try {
                let o_resp = await fetch('/api/generate-model', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s_path_image: o_result.s_path_image, s_word: s_word, s_folder_name: s_folder_name }),
                });
                let o_data = await o_resp.json();
                if (o_data.s_error) throw new Error(o_data.s_error);
                o_result.s_path_model = o_data.s_path_model;
                o_result.n_id_fsnode_model = o_data.n_id_fsnode;
            } catch (o_error) {
                o_result.s_error = '3D model generation failed: ' + o_error.message;
                o_result.s_status = 'error';
                o_self.n_done++;
                o_self.s_status = o_self.n_done + '/' + n_total + ' done';
                return;
            }

            o_result.s_status = 'done';
            o_self.n_done++;
            o_self.s_status = o_self.n_done + '/' + n_total + ' done';
            o_self.f_convert_stl(o_result);
        },
    },
};

export { o_component__generatedata };
