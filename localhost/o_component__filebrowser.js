// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import { f_s_path_parent } from './functions.js';
import {
    f_o_wsmsg,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_a_o_fsnode,
} from './constructors.js';
import { s_db_create, s_db_read, s_db_update } from './runtimedata.js';

let o_component__filebrowser = {
    name: 'component-filebrowser',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_filebrowser',
        a_o: [
            {
                s_tag: 'div',
                class: 'o_filebrowser__path_bar',
                a_o: [
                    {
                        s_tag: 'div',
                        ':class': "'interactable' + (s_path_absolute === s_ds ? ' disabled' : '')",
                        'v-on:click': 'f_navigate_up',
                        innerText: '..',
                    },
                    {
                        s_tag: 'div',
                        class: 'o_filebrowser__path',
                        innerText: '{{ s_path_absolute }}',
                    },
                ],
            },
            {
                s_tag: 'div',
                class: 'o_filebrowser__list',
                a_o: [
                    {
                        s_tag: 'div',
                        'v-for': 'o_fsnode of a_o_fsnode',
                        ':class': "'o_fsnode ' + (o_fsnode.b_folder ? 'interactable' : 'file')",
                        'v-on:click': 'f_click_fsnode(o_fsnode)',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_fsnode__type',
                                innerText: "{{ o_fsnode.b_folder ? 'dir' : 'file' }}",
                            },
                            {
                                s_tag: 'div',
                                class: 'o_fsnode__name',
                                innerText: '{{ o_fsnode.s_name }}',
                            },
                        ],
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            s_path_absolute: '/',
            s_ds: '/',
            n_id__keyvalpair: null,
            a_o_fsnode: [],
        };
    },
    methods: {
        f_load_a_o_fsnode: async function() {
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_a_o_fsnode.s_name, [
                    this.s_path_absolute,
                    false, 
                    false
                ])
            );
            this.a_o_fsnode = o_resp.v_result || [];
        },
        f_save_path: async function(s_path_absolute) {
            let o_self = this;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_update, 'a_o_keyvalpair', { n_id: o_self.n_id__keyvalpair }, { s_key: 's_path_absolute__filebrowser', s_value: s_path_absolute }]
                )
            );
            let n_idx = (o_state.a_o_keyvalpair || []).findIndex(function(o) { return o.n_id === o_self.n_id__keyvalpair; });
            if (n_idx !== -1) o_state.a_o_keyvalpair[n_idx].s_value = s_path_absolute;
        },
        f_click_fsnode: async function(o_fsnode) {
            if (!o_fsnode.b_folder) return;
            this.s_path_absolute = o_fsnode.s_path_absolute;
            await this.f_save_path(this.s_path_absolute);
            await this.f_load_a_o_fsnode();
        },
        f_navigate_up: async function() {
            let s_path_parent = f_s_path_parent(this.s_path_absolute, this.s_ds);
            if (s_path_parent === this.s_path_absolute) return;
            this.s_path_absolute = s_path_parent;
            await this.f_save_path(this.s_path_absolute);
            await this.f_load_a_o_fsnode();
        },
    },
    created: async function() {
        let o_self = this;
        o_self.s_ds = o_state.s_ds || '/';
        let o_resp = await f_send_wsmsg_with_response(
            f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, [s_db_read, 'a_o_keyvalpair', { s_key: 's_path_absolute__filebrowser' }])
        );
        let a_o_result = o_resp.v_result || [];
        if (a_o_result.length > 0) {
            o_self.s_path_absolute = a_o_result[0].s_value;
            o_self.n_id__keyvalpair = a_o_result[0].n_id;
        } else {
            let o_resp_create = await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    [s_db_create, 'a_o_keyvalpair', { s_key: 's_path_absolute__filebrowser', s_value: o_self.s_path_absolute }]
                )
            );
            o_self.n_id__keyvalpair = o_resp_create.v_result?.n_id;
            if (!o_state.a_o_keyvalpair) o_state.a_o_keyvalpair = [];
            o_state.a_o_keyvalpair.push(o_resp_create.v_result);
        }
        await o_self.f_load_a_o_fsnode();
    },
};

export { o_component__filebrowser };
