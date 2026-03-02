// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { o_state } from './index.js';

let o_component__generatedata = {
    name: 'component-generatedata',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_generatedata',
        a_o: [
            {
                class: 'o_generatedata__controls',
                a_o: [
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
                                        'v-if': '!o_result.s_path_stl && !o_result.b_converting_stl',
                                        class: 'interactable o_generatedata__btn_small',
                                        'v-on:click': 'f_download_stl(o_result)',
                                        innerText: 'Download STL',
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
                        ],
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            s_prompt: o_state.s_prompt__default || '',
            s_words: (o_state.a_s_animal || []).join(', '),
            b_generating: false,
            s_status: '',
            a_o_result: [],
        };
    },
    watch: {
        'o_state.s_prompt__default': function(s_new) {
            if (s_new && !this.s_prompt) this.s_prompt = s_new;
        },
        'o_state.a_s_animal': function(a_new) {
            if (a_new && !this.s_words) this.s_words = a_new.join(', ');
        },
    },
    methods: {
        f_generate: async function() {
            let o_self = this;
            if (o_self.b_generating) return;

            let a_s_word = o_self.s_words
                .split(',')
                .map(function(s) { return s.trim(); })
                .filter(function(s) { return s !== ''; });

            if (a_s_word.length === 0) return;

            o_self.b_generating = true;
            o_self.a_o_result = [];

            for (let n_idx = 0; n_idx < a_s_word.length; n_idx++) {
                let s_word = a_s_word[n_idx];
                let s_prompt_resolved = o_self.s_prompt.replace(/\[s\]/g, s_word);

                let o_result = {
                    s_word: s_word,
                    s_prompt_resolved: s_prompt_resolved,
                    s_status: 'generating_image',
                    s_path_image: null,
                    s_url_image: null,
                    s_path_model: null,
                    s_path_stl: null,
                    b_converting_stl: false,
                    s_error: null,
                };
                o_self.a_o_result.push(o_result);
                o_self.s_status = 'Generating image ' + (n_idx + 1) + '/' + a_s_word.length + ': ' + s_word;

                // generate image
                try {
                    let o_resp = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ s_prompt: s_prompt_resolved, s_word: s_word }),
                    });
                    let o_data = await o_resp.json();
                    if (o_data.s_error) throw new Error(o_data.s_error);
                    o_result.s_path_image = o_data.s_path_image;
                    o_result.s_url_image = o_data.s_url_image;
                } catch (o_error) {
                    o_result.s_error = 'Image generation failed: ' + o_error.message;
                    o_result.s_status = 'error';
                    continue;
                }

                // generate 3D model
                o_result.s_status = 'generating_model';
                o_self.s_status = 'Generating 3D model ' + (n_idx + 1) + '/' + a_s_word.length + ': ' + s_word;

                try {
                    let o_resp = await fetch('/api/generate-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ s_url_image: o_result.s_url_image, s_word: s_word }),
                    });
                    let o_data = await o_resp.json();
                    if (o_data.s_error) throw new Error(o_data.s_error);
                    o_result.s_path_model = o_data.s_path_model;
                } catch (o_error) {
                    o_result.s_error = '3D model generation failed: ' + o_error.message;
                    o_result.s_status = 'error';
                    continue;
                }

                o_result.s_status = 'done';
            }

            o_self.b_generating = false;
            o_self.s_status = 'Done!';
        },
        f_download_stl: async function(o_result) {
            if (o_result.b_converting_stl || o_result.s_path_stl) return;
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
                // trigger download
                let o_a = document.createElement('a');
                o_a.href = '/api/file?path=' + encodeURIComponent(o_data.s_path_stl);
                o_a.download = o_result.s_word + '.stl';
                o_a.click();
            } catch (o_error) {
                o_result.s_error = 'STL conversion failed: ' + o_error.message;
            } finally {
                o_result.b_converting_stl = false;
            }
        },
    },
};

export { o_component__generatedata };
