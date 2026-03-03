// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_send_wsmsg_with_response, o_state } from './index.js';

import {
    f_o_html_from_o_js,
} from "./lib/handyhelpers.js"

import {
    o_model__o_imagegeneratorprompt,
    o_model__o_imagegeneratorsubject,
    o_model__o_imagegeneratorprompt_o_imagegeneratorsubject,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__from_o_model,
    s_name_prop_id,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    o_wsmsg__f_v_crud__indb,
    f_o_wsmsg,
} from './constructors.js';
import { s_db_create, s_db_delete } from './runtimedata.js';

let s_table__prompt = f_s_name_table__from_o_model(o_model__o_imagegeneratorprompt);
let s_table__subject = f_s_name_table__from_o_model(o_model__o_imagegeneratorsubject);
let s_table__junction = f_s_name_table__from_o_model(o_model__o_imagegeneratorprompt_o_imagegeneratorsubject);
let s_fk__prompt = f_s_name_foreign_key__from_o_model(o_model__o_imagegeneratorprompt);
let s_fk__subject = f_s_name_foreign_key__from_o_model(o_model__o_imagegeneratorsubject);

let o_component__generateprompts = {
    name: 'component-generateprompts',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_generateprompts',
        a_o: [
            // left panel: prompt list
            {
                class: 'o_generateprompts__sidebar',
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_generateprompts__sidebar_header',
                        innerText: 'Prompts',
                    },
                    {
                        s_tag: 'div',
                        'v-for': 'o_prompt in a_o_prompt',
                        ':class': "'interactable o_generateprompts__prompt_item' + (o_prompt__selected && o_prompt__selected.n_id === o_prompt.n_id ? ' active' : '')",
                        'v-on:click': 'f_select_prompt(o_prompt)',
                        innerText: '{{ o_prompt.s_label }}',
                    },
                    {
                        s_tag: 'div',
                        class: 'interactable o_generateprompts__btn',
                        'v-on:click': 'f_toggle_new_prompt',
                        innerText: "{{ b_show_new_prompt ? 'Cancel' : 'New prompt' }}",
                    },
                ],
            },
            // right panel: detail
            {
                class: 'o_generateprompts__detail',
                a_o: [
                    // new prompt form
                    {
                        s_tag: 'div',
                        'v-if': 'b_show_new_prompt',
                        class: 'o_generateprompts__form',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__form_title',
                                innerText: 'Create new prompt',
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Label' },
                                    { s_tag: 'input', 'v-model': 'o_new_prompt.s_label', placeholder: 'e.g. low polygon animal' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Prompt generator prompt' },
                                    { s_tag: 'textarea', 'v-model': 'o_new_prompt.s_promptgenerator_prompt', rows: '2', placeholder: 'Instructions for AI prompt generation...' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Prompt template ([s] = subject)' },
                                    { s_tag: 'textarea', 'v-model': 'o_new_prompt.s_prompt_template', rows: '4', placeholder: 'Low-polygon [s] figurine, ...' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable o_generateprompts__btn',
                                'v-on:click': 'f_create_prompt',
                                innerText: 'Create',
                            },
                        ],
                    },
                    // selected prompt detail
                    {
                        s_tag: 'div',
                        'v-if': 'o_prompt__selected && !b_show_new_prompt',
                        class: 'o_generateprompts__selected',
                        a_o: [
                            // prompt fields
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Label' },
                                    { s_tag: 'div', class: 'o_generateprompts__value', innerText: '{{ o_prompt__selected.s_label }}' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Prompt generator prompt' },
                                    { s_tag: 'div', class: 'o_generateprompts__value', innerText: '{{ o_prompt__selected.s_promptgenerator_prompt }}' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__field',
                                a_o: [
                                    { s_tag: 'label', innerText: 'Prompt template' },
                                    { s_tag: 'div', class: 'o_generateprompts__value o_generateprompts__value_template', innerText: '{{ o_prompt__selected.s_prompt_template }}' },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable o_generateprompts__btn o_generateprompts__btn_delete',
                                'v-on:click': 'f_delete_prompt',
                                innerText: 'Delete prompt',
                            },
                            // subjects section
                            {
                                s_tag: 'div',
                                class: 'o_generateprompts__subjects_section',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_generateprompts__subjects_header',
                                        innerText: "{{ 'Subjects (' + a_o_subject__linked.length + ')' }}",
                                    },
                                    // linked subjects list
                                    {
                                        s_tag: 'div',
                                        class: 'o_generateprompts__subjects_list',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                'v-for': 'o_subject in a_o_subject__linked',
                                                class: 'o_generateprompts__subject_item',
                                                a_o: [
                                                    { s_tag: 'span', innerText: '{{ o_subject.s_name }}' },
                                                    {
                                                        s_tag: 'div',
                                                        class: 'interactable o_generateprompts__btn_small',
                                                        'v-on:click': 'f_unlink_subject(o_subject)',
                                                        innerText: 'x',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    // add existing subject
                                    {
                                        s_tag: 'div',
                                        class: 'o_generateprompts__add_subject',
                                        a_o: [
                                            {
                                                s_tag: 'select',
                                                'v-model': 'n_id_subject__to_link',
                                                a_o: [
                                                    { s_tag: 'option', ':value': 'null', innerText: '— add existing subject —' },
                                                    {
                                                        s_tag: 'option',
                                                        'v-for': 'o_subject in a_o_subject__unlinked',
                                                        ':value': 'o_subject.n_id',
                                                        innerText: '{{ o_subject.s_name }}',
                                                    },
                                                ],
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_generateprompts__btn_small',
                                                'v-on:click': 'f_link_subject',
                                                innerText: 'Add',
                                            },
                                        ],
                                    },
                                    // create new subject and link
                                    {
                                        s_tag: 'div',
                                        class: 'o_generateprompts__add_subject',
                                        a_o: [
                                            {
                                                s_tag: 'input',
                                                'v-model': 's_new_subject',
                                                placeholder: 'New subject name...',
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_generateprompts__btn_small',
                                                'v-on:click': 'f_create_and_link_subject',
                                                innerText: 'Create & add',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    // no selection placeholder
                    {
                        s_tag: 'div',
                        'v-if': '!o_prompt__selected && !b_show_new_prompt',
                        class: 'o_generateprompts__placeholder',
                        innerText: 'Select a prompt or create a new one',
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_prompt__selected: null,
            b_show_new_prompt: false,
            o_new_prompt: { s_label: '', s_promptgenerator_prompt: '', s_prompt_template: '' },
            n_id_subject__to_link: null,
            s_new_subject: '',
        };
    },
    computed: {
        a_o_prompt: function() {
            return o_state[s_table__prompt] || [];
        },
        a_o_subject__linked: function() {
            let o_self = this;
            if (!o_self.o_prompt__selected) return [];
            let n_id_prompt = o_self.o_prompt__selected.n_id;
            let a_o_junction = o_state[s_table__junction] || [];
            let a_n_id_subject = a_o_junction
                .filter(function(o) { return o[s_fk__prompt] === n_id_prompt; })
                .map(function(o) { return o[s_fk__subject]; });
            let a_o_subject = o_state[s_table__subject] || [];
            return a_o_subject.filter(function(o) {
                return a_n_id_subject.includes(o.n_id);
            });
        },
        a_o_subject__unlinked: function() {
            let o_self = this;
            let a_o_linked = o_self.a_o_subject__linked;
            let a_n_id_linked = a_o_linked.map(function(o) { return o.n_id; });
            let a_o_subject = o_state[s_table__subject] || [];
            return a_o_subject.filter(function(o) {
                return !a_n_id_linked.includes(o.n_id);
            });
        },
    },
    methods: {
        f_select_prompt: function(o_prompt) {
            this.o_prompt__selected = o_prompt;
            this.b_show_new_prompt = false;
            this.n_id_subject__to_link = null;
            this.s_new_subject = '';
        },
        f_toggle_new_prompt: function() {
            this.b_show_new_prompt = !this.b_show_new_prompt;
            if (this.b_show_new_prompt) {
                this.o_prompt__selected = null;
                this.o_new_prompt = { s_label: '', s_promptgenerator_prompt: '', s_prompt_template: '' };
            }
        },
        f_create_prompt: async function() {
            let o_self = this;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_create, s_table__prompt, o_self.o_new_prompt]
                )
            );
            if (o_resp.v_result) {
                o_self.o_prompt__selected = o_resp.v_result;
                o_self.b_show_new_prompt = false;
            }
        },
        f_delete_prompt: async function() {
            let o_self = this;
            if (!o_self.o_prompt__selected) return;
            // delete junction entries for this prompt first
            let a_o_junction = (o_state[s_table__junction] || []).filter(function(o) {
                return o[s_fk__prompt] === o_self.o_prompt__selected.n_id;
            });
            for (let o_junc of a_o_junction) {
                await f_send_wsmsg_with_response(
                    f_o_wsmsg(
                        o_wsmsg__f_v_crud__indb.s_name,
                        [s_db_delete, s_table__junction, o_junc]
                    )
                );
            }
            // delete the prompt
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_delete, s_table__prompt, o_self.o_prompt__selected]
                )
            );
            o_self.o_prompt__selected = null;
        },
        f_link_subject: async function() {
            let o_self = this;
            if (!o_self.o_prompt__selected || o_self.n_id_subject__to_link === null) return;
            let o_junction_data = {};
            o_junction_data[s_fk__prompt] = o_self.o_prompt__selected.n_id;
            o_junction_data[s_fk__subject] = o_self.n_id_subject__to_link;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_create, s_table__junction, o_junction_data]
                )
            );
            o_self.n_id_subject__to_link = null;
        },
        f_unlink_subject: async function(o_subject) {
            let o_self = this;
            if (!o_self.o_prompt__selected) return;
            let a_o_junction = o_state[s_table__junction] || [];
            let o_junc = a_o_junction.find(function(o) {
                return o[s_fk__prompt] === o_self.o_prompt__selected.n_id
                    && o[s_fk__subject] === o_subject.n_id;
            });
            if (!o_junc) return;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_delete, s_table__junction, o_junc]
                )
            );
        },
        f_create_and_link_subject: async function() {
            let o_self = this;
            if (!o_self.o_prompt__selected || !o_self.s_new_subject.trim()) return;
            // create the subject
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_create, s_table__subject, { s_name: o_self.s_new_subject.trim() }]
                )
            );
            if (!o_resp.v_result) return;
            // link it to the selected prompt
            let o_junction_data = {};
            o_junction_data[s_fk__prompt] = o_self.o_prompt__selected.n_id;
            o_junction_data[s_fk__subject] = o_resp.v_result.n_id;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_create, s_table__junction, o_junction_data]
                )
            );
            o_self.s_new_subject = '';
        },
    },
};

export { o_component__generateprompts };
