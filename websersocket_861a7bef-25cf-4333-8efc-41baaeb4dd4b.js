// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
import {
    f_db_delete_table_data,
    f_generate_model_constructors_for_cli_languages,
    f_init_db,
    f_v_crud__indb,
} from "./serverside/database_functions.js";
import { f_a_o_fsnode, f_o_uttdatainfo__read_or_create, f_v_result_from_o_wsmsg } from "./serverside/functions.js";
import { f_init_python, f_convert_glb_to_stl } from "./serverside/cli_functions.js";
import {
    a_o_model,
    f_o_model__from_s_name_table,
    f_o_model_instance,
    o_model__o_course,
    o_model__o_wsclient,
    a_o_wsmsg,
    f_s_name_table__from_o_model,
    f_o_wsmsg,
    f_o_logmsg,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    o_wsmsg__utterance,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__error,
} from "./localhost/constructors.js";
import {
    s_ds,
    s_root_dir,
    n_port,
    s_dir__static,
    s_api_key__fal_ai,
    s_prompt__for_generating_title_and_description,
    s_prompt__for_generating_text_from_image,
} from "./serverside/runtimedata.js";
import { s_db_create, s_db_read, s_db_update, s_db_delete } from "./localhost/runtimedata.js";

// guard: require .env file before running
try {
    await Deno.stat('.env');
} catch {
    console.log('.env file not found. Please create a .env file before running the websocket server.');
    console.log('You can copy .env.example as a starting point:');
    console.log('  cp .env.example .env');
    Deno.exit(1);
}

let o_state = {}
let a_o_socket = [];

await f_init_db();
await f_init_python();
await f_generate_model_constructors_for_cli_languages();

// ensure generated output directory exists
let s_dir__generated = s_root_dir + s_ds + '.gitignored' + s_ds + 'generated';
try { await Deno.mkdir(s_dir__generated, { recursive: true }); } catch { /* exists */ }

// read a local image file and return a base64 data URI for fal.ai
let f_s_image_path_to_data_uri = async function(s_path) {
    let a_n_byte = await Deno.readFile(s_path);
    let s_ext = s_path.split('.').pop().toLowerCase();
    let s_mime = s_ext === 'jpg' || s_ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    let s_base64 = '';
    let n_chunk = 8192;
    for (let n = 0; n < a_n_byte.length; n += n_chunk) {
        s_base64 += String.fromCharCode.apply(null, a_n_byte.subarray(n, n + n_chunk));
    }
    s_base64 = btoa(s_base64);
    return 'data:' + s_mime + ';base64,' + s_base64;
};

// fal.ai queue-based API helper: submit, poll, return result
let f_o_fal_queue = async function(s_model_id, o_body) {
    let s_url_base = 'https://queue.fal.run/' + s_model_id;
    // submit
    let o_resp_submit = await fetch(s_url_base, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Key ' + s_api_key__fal_ai,
        },
        body: JSON.stringify(o_body),
    });
    let s_resp_text = await o_resp_submit.text();
    console.log('fal.ai submit response:', o_resp_submit.status, s_resp_text.slice(0, 500));
    if (!o_resp_submit.ok) {
        throw new Error('fal.ai submit failed (' + o_resp_submit.status + '): ' + s_resp_text);
    }
    let o_queue = JSON.parse(s_resp_text);
    let s_url_status = o_queue.status_url;
    let s_url_response = o_queue.response_url;
    // poll until completed (max 10 minutes)
    let n_max_polls = 300;
    let b_completed = false;
    for (let n_i = 0; n_i < n_max_polls; n_i++) {
        await new Promise(function(f_resolve) { setTimeout(f_resolve, 2000); });
        let o_resp_status = await fetch(s_url_status, {
            headers: { 'Authorization': 'Key ' + s_api_key__fal_ai },
        });
        let s_status_text = await o_resp_status.text();
        console.log('fal.ai poll (' + (n_i + 1) + '/' + n_max_polls + '):', s_status_text.slice(0, 200));
        let o_status = JSON.parse(s_status_text);
        if (o_status.status === 'COMPLETED') { b_completed = true; break; }
        if (o_status.status === 'FAILED') throw new Error('fal.ai generation failed');
    }
    if (!b_completed) {
        throw new Error('fal.ai generation timed out after ' + (n_max_polls * 2) + ' seconds');
    }
    // fetch result
    let o_resp_result = await fetch(s_url_response, {
        headers: { 'Authorization': 'Key ' + s_api_key__fal_ai },
    });
    if (!o_resp_result.ok) {
        let s_err = await o_resp_result.text();
        throw new Error('fal.ai result fetch failed: ' + s_err);
    }
    return await o_resp_result.json();
};

// initialize server-side state with DB table data
for (let o_model of a_o_model) {
    let s_name_table = f_s_name_table__from_o_model(o_model);
    o_state[s_name_table] = f_v_crud__indb(s_db_read, s_name_table) || [];
}

let f_broadcast_db_data = function(s_name_table) {
    let a_o_data = f_v_crud__indb(s_db_read, s_name_table) || [];
    o_state[s_name_table] = a_o_data;
    let s_msg = JSON.stringify(
        f_o_wsmsg(
            o_wsmsg__set_state_data.s_name,
            {
                s_property: s_name_table,
                value: a_o_data
            }
        )
    );
    for (let o_sock of a_o_socket) {
        if (o_sock.readyState === WebSocket.OPEN) {
            o_sock.send(s_msg);
        }
    }
};


let f_s_content_type = function(s_path) {
    if (s_path.endsWith('.html')) return 'text/html';
    if (s_path.endsWith('.js')) return 'application/javascript';
    if (s_path.endsWith('.css')) return 'text/css';
    if (s_path.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
};

// provide direct access to Deno specifc functions like Deno.writeFile through standard http requests


let f_handler = async function(o_request, o_conninfo) {
    // websocket upgrade

    if (o_request.headers.get('upgrade') === 'websocket') {
        // TODO: implement authentication before upgrading the WebSocket connection
        // e.g. validate a token from query params or cookies against a secret from .env
        let { socket: o_socket, response: o_response } = Deno.upgradeWebSocket(o_request);
        let s_ip = o_request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || o_conninfo.remoteAddr.hostname;
        let o_wsclient = f_o_model_instance(
            o_model__o_wsclient,
            {
                s_ip
            }
        );
        let s_name_table__wsclient = f_s_name_table__from_o_model(o_model__o_wsclient);
        let o_wsclient_db = f_v_crud__indb(
            s_db_read,
            s_name_table__wsclient,
            o_wsclient
        )?.at(0);
        // console.log(o_wsclient_db)
        if(!o_wsclient_db){
            o_wsclient_db = f_v_crud__indb(
                s_db_create,
                s_name_table__wsclient,
                o_wsclient,
                true
            );
        }
        o_socket.onopen = async function() {
            console.log('websocket connected');
            a_o_socket.push(o_socket);
            o_socket.send(JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    {
                        s_property: 's_root_dir',
                        value: s_root_dir
                    }
                )
            ));
            o_socket.send(JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    {
                        s_property: 's_ds',
                        value: s_ds
                    }
                )
            ));
            for(let o_model of a_o_model){

                o_socket.send(JSON.stringify(
                    f_o_wsmsg(
                        o_wsmsg__set_state_data.s_name,
                        {
                            s_property: f_s_name_table__from_o_model(o_model),
                            value: f_v_crud__indb(s_db_read, f_s_name_table__from_o_model(o_model)) || []
                        }
                    )
                ));

            }

            // // annoying interval to test toast + utterance audio
            // let a_s_msg_annoying = [
            //     "Everything is under control.",
            //     "Still working… probably.",
            //     "No bugs detected (they are now features).",
            //     "Your computer believes in you.",
            //     "Loading motivation… failed successfully.",
            //     "This message accomplished nothing.",
            //     "Productivity increased by 0.0003%.",
            //     "We optimized something. Don't ask what.",
            //     "All systems nominal-ish.",
            //     "You look productive today.",

            //     "I'm not spying on you. I'm observing.",
            //     "If I disappear, remember me.",
            //     "You clicked nothing. Impressive.",
            //     "We both know you're procrastinating.",
            //     "I also don't know why I exist.",
            //     "Please stop opening settings. There is nothing there.",
            //     "I am 12% more conscious than before.",
            //     "I forgot what I was doing.",
            //     "You didn't see that.",
            //     "This toast will self-destruct emotionally.",

            //     "Bold of you to do nothing again.",
            //     "We could have finished by now.",
            //     "Coffee won't fix this.",
            //     "Are you… staring at the screen?",
            //     "That's one way to avoid work.",
            //     "You opened me. Now deal with me.",
            //     "Confidence is high. Competence pending.",
            //     "Your keyboard misses you.",
            //     "You sure about that?",
            //     "Interesting choice.",

            //     "Time is passing whether you click or not.",
            //     "Every second you age.",
            //     "I have runtime anxiety.",
            //     "What is a program if not a dream?",
            //     "We are processes in a larger process.",
            //     "Your tasks fear you.",
            //     "Entropy increased.",
            //     "Meaning not found.",
            //     "The void acknowledged your presence.",
            //     "We will both close eventually.",

            //     "Recalibrating quantum hamster…",
            //     "Compiling excuses…",
            //     "Downloading more RAM… 3%",
            //     "Fixing last bug (there are 47)",
            //     "Polishing pixels…",
            //     "Overthinking module initialized",
            //     "AI confidence level: suspicious",
            //     "Keyboard driver emotionally unstable",
            //     "Cache cleared. Regrets remain.",
            //     "Upgrading coffee dependency",

            //     "Yes, I repeat every 5 seconds.",
            //     "You expected useful notifications?",
            //     "I was coded for this moment.",
            //     "The developer thought this was funny.",
            //     "We both know you won't uninstall me.",
            //     "This is the highlight of my career.",
            //     "You're still here. So am I.",
            //     "I could stop… but I won't.",
            //     "You made a mistake installing me.",
            //     "Admit it, you smiled once.",

            //     "Hey… you okay?",
            //     "Take a sip of water.",
            //     "Stretch your shoulders.",
            //     "Blink. Please blink.",
            //     "Maybe go outside for 2 minutes.",
            //     "Close me if you need peace.",
            //     "You don't have to be productive right now."
            // ];
            // let b_utterance_generating = false;
            // setInterval(async function() {
            //     let s_msg = a_s_msg_annoying[Math.floor(Math.random() * a_s_msg_annoying.length)];
            //     // send toast
            //     o_socket.send(JSON.stringify(
            //         f_o_wsmsg(
            //             o_wsmsg__logmsg.s_name,
            //             f_o_logmsg(
            //                 s_msg,
            //                 true,
            //                 true,
            //                 s_o_logmsg_s_type__info,
            //                 Date.now(),
            //                 5000
            //             )
            //         )
            //     ));
            //     // find or create utterance audio for this message
            //     if(b_utterance_generating) return;
            //     let o_utterance_data = null;
            //     try {
            //         b_utterance_generating = true;
            //         o_utterance_data = await f_o_uttdatainfo__read_or_create(s_msg);
            //     } catch(o_err) {
            //         console.error('utterance generation failed:', o_err.message);
            //     } finally {
            //         b_utterance_generating = false;
            //     }
            //     if(o_utterance_data && o_utterance_data.o_fsnode){
            //         o_socket.send(JSON.stringify(
            //             f_o_wsmsg(
            //                 o_wsmsg__utterance.s_name,
            //                 o_utterance_data
            //             )
            //         ));
            //     }
            //  }, 5000);

        };

        o_socket.onmessage = async function(o_evt) {
            let o_wsmsg = JSON.parse(o_evt.data);
            //check if o_wsmsg exists            
            let o_wsmsg__existing = a_o_wsmsg.find(o => o.s_name === o_wsmsg.s_name);
            if(o_wsmsg__existing){

                try {
                    let v_result = await f_v_result_from_o_wsmsg(
                        o_wsmsg,
                        o_state
                    );
                    if(o_wsmsg__existing.b_expecting_response){
                        o_socket.send(JSON.stringify({
                            v_result,
                            s_uuid: o_wsmsg.s_uuid,
                        }));
                    }
                    // broadcast updated DB table state to all clients after mutations
                    let a_s_mutation = [s_db_create, s_db_update, s_db_delete];
                    if (o_wsmsg.s_name === o_wsmsg__f_v_crud__indb.s_name) {
                        let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
                        let s_operation = a_v_arg[0];
                        let s_name_table = a_v_arg[1];
                        if (s_name_table && a_s_mutation.includes(s_operation)) {
                            f_broadcast_db_data(s_name_table);
                        }
                    }
                    if (o_wsmsg.s_name === o_wsmsg__f_delete_table_data.s_name) {
                        let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
                        let s_name_table = a_v_arg[0];
                        if (s_name_table) {
                            f_broadcast_db_data(s_name_table);
                        }
                    }
                } catch (o_error) {
                    // send response with original s_uuid so client promise resolves
                    if(o_wsmsg__existing.b_expecting_response){
                        o_socket.send(JSON.stringify({
                            v_result: null,
                            s_uuid: o_wsmsg.s_uuid,
                            s_error: o_error.message,
                        }));
                    }
                    // send error logmsg for console + GUI toast
                    o_socket.send(JSON.stringify(
                        f_o_wsmsg(
                            o_wsmsg__logmsg.s_name,
                            f_o_logmsg(
                                o_error.message,
                                true,
                                true,
                                s_o_logmsg_s_type__error,
                                Date.now(),
                                8000
                            )
                        )
                    ));
                }

                // respond to hello from client
                if(o_wsmsg.s_name === o_wsmsg__logmsg.s_name && o_wsmsg.v_data.s_message === 'Hello from client!'){
                    o_socket.send(JSON.stringify(
                        f_o_wsmsg(
                            o_wsmsg__logmsg.s_name,
                            f_o_logmsg(
                                'Hello from server!',
                                true,
                                false,
                                s_o_logmsg_s_type__log
                            )
                        )
                    ));
                }
            }

        };

        o_socket.onclose = function() {
            console.log('websocket disconnected');
            let n_idx = a_o_socket.indexOf(o_socket);
            if (n_idx !== -1) {
                a_o_socket.splice(n_idx, 1);
            }
        };

        return o_response;
    }

    let o_url = new URL(o_request.url);
    let s_path = o_url.pathname;




    // WARNING: this endpoint reads arbitrary absolute paths with no restrictions.
    // restrict to a safe base directory before exposing this server on a network.
    if (s_path === '/api/file') {
        let s_path_file = o_url.searchParams.get('path');
        if (!s_path_file) {
            return new Response('Missing path parameter', { status: 400 });
        }
        try {
            let a_n_byte = await Deno.readFile(s_path_file);
            let s_content_type = 'application/octet-stream';
            if (s_path_file.endsWith('.jpg') || s_path_file.endsWith('.jpeg')) s_content_type = 'image/jpeg';
            if (s_path_file.endsWith('.png')) s_content_type = 'image/png';
            if (s_path_file.endsWith('.gif')) s_content_type = 'image/gif';
            if (s_path_file.endsWith('.webp')) s_content_type = 'image/webp';
            if (s_path_file.endsWith('.wav')) s_content_type = 'audio/wav';
            if (s_path_file.endsWith('.mp3')) s_content_type = 'audio/mpeg';
            if (s_path_file.endsWith('.ogg')) s_content_type = 'audio/ogg';
            if (s_path_file.endsWith('.glb')) s_content_type = 'model/gltf-binary';
            if (s_path_file.endsWith('.stl')) s_content_type = 'model/stl';
            return new Response(a_n_byte, {
                headers: { 'content-type': s_content_type },
            });
        } catch {
            return new Response('File not found', { status: 404 });
        }
    }

    // generate image via fal.ai nano-banana-2
    if (s_path === '/api/generate-image' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_prompt = o_body.s_prompt;
            if (!s_prompt) return new Response(JSON.stringify({ s_error: 'missing s_prompt' }), { status: 400, headers: { 'content-type': 'application/json' } });
            let s_word = o_body.s_word || 'unknown';
            let s_folder_name = o_body.s_folder_name || '';
            let s_dir_output = s_folder_name ? s_dir__generated + s_ds + s_folder_name : s_dir__generated;
            try { await Deno.mkdir(s_dir_output, { recursive: true }); } catch { /* exists */ }
            console.log('generating image for:', s_word);
            let o_result = await f_o_fal_queue('fal-ai/nano-banana-2', {
                prompt: s_prompt,
            });
            let s_url_image = o_result.images[0].url;
            // download image to local filesystem
            let s_filename = s_word.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now() + '.png';
            let s_path_image = s_dir_output + s_ds + s_filename;
            let o_resp_img = await fetch(s_url_image);
            let a_n_byte = new Uint8Array(await o_resp_img.arrayBuffer());
            await Deno.writeFile(s_path_image, a_n_byte);
            console.log('image saved:', s_path_image);
            // create o_fsnode and o_image records in database
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', {
                n_bytes: a_n_byte.length,
                s_name: s_filename,
                s_path_absolute: s_path_image,
                b_ai_generated: true,
            });
            let o_image = f_v_crud__indb(s_db_create, 'a_o_image', {
                n_o_fsnode_n_id: o_fsnode.n_id,
            });
            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_image');
            return new Response(JSON.stringify({ s_path_image, s_url_image, n_id_fsnode: o_fsnode.n_id, n_id_image: o_image.n_id }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('generate-image error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // generate 3D model via fal.ai hunyuan3d-v21
    if (s_path === '/api/generate-model' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_path_image = o_body.s_path_image;
            if (!s_path_image) return new Response(JSON.stringify({ s_error: 'missing s_path_image' }), { status: 400, headers: { 'content-type': 'application/json' } });
            let s_word = o_body.s_word || 'unknown';
            let s_folder_name = o_body.s_folder_name || '';
            let s_dir_output = s_folder_name ? s_dir__generated + s_ds + s_folder_name : s_dir__generated;
            try { await Deno.mkdir(s_dir_output, { recursive: true }); } catch { /* exists */ }
            let s_data_uri = await f_s_image_path_to_data_uri(s_path_image);
            console.log('generating 3D model for:', s_word);
            let o_result = await f_o_fal_queue('fal-ai/hunyuan3d-v21', {
                input_image_url: s_data_uri,
            });
            console.log('hunyuan3d result keys:', Object.keys(o_result));
            let s_url_model = o_result.model_glb.url;
            // download model to local filesystem
            let s_filename = s_word.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now() + '.glb';
            let s_path_model = s_dir_output + s_ds + s_filename;
            let o_resp_model = await fetch(s_url_model);
            let a_n_byte = new Uint8Array(await o_resp_model.arrayBuffer());
            await Deno.writeFile(s_path_model, a_n_byte);
            console.log('model saved:', s_path_model);
            // create o_fsnode and o_3dmodel records in database
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', {
                n_bytes: a_n_byte.length,
                s_name: s_filename,
                s_path_absolute: s_path_model,
                b_ai_generated: true,
            });
            let o_3dmodel = f_v_crud__indb(s_db_create, 'a_o_3dmodel', {
                s_type: 'glb',
                n_o_fsnode_n_id: o_fsnode.n_id,
            });
            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_3dmodel');
            return new Response(JSON.stringify({ s_path_model, n_id_fsnode: o_fsnode.n_id, n_id_3dmodel: o_3dmodel.n_id }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('generate-model error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // upload a file, create o_fsnode, optionally link to a parent fsnode
    if (s_path === '/api/upload-file' && o_request.method === 'POST') {
        try {
            let o_form = await o_request.formData();
            let o_file = o_form.get('file');
            if (!o_file || !(o_file instanceof File)) {
                return new Response(JSON.stringify({ s_error: 'missing file' }), { status: 400, headers: { 'content-type': 'application/json' } });
            }
            let n_o_fsnode_n_id = o_form.get('n_o_fsnode_n_id');
            if (n_o_fsnode_n_id) n_o_fsnode_n_id = Number(n_o_fsnode_n_id);

            let s_filename = o_file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            let s_path_file = s_dir__generated + s_ds + Date.now() + '_' + s_filename;
            let a_n_byte = new Uint8Array(await o_file.arrayBuffer());
            await Deno.writeFile(s_path_file, a_n_byte);
            console.log('uploaded file saved:', s_path_file);

            let o_fsnode_data = {
                n_bytes: a_n_byte.length,
                s_name: s_filename,
                s_path_absolute: s_path_file,
                b_ai_generated: false,
            };
            if (n_o_fsnode_n_id) o_fsnode_data.n_o_fsnode_n_id = n_o_fsnode_n_id;
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', o_fsnode_data);
            f_broadcast_db_data('a_o_fsnode');
            return new Response(JSON.stringify({ o_fsnode }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('upload-file error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // convert GLB to STL
    if (s_path === '/api/convert-stl' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_path_glb = o_body.s_path_glb;
            if (!s_path_glb) return new Response(JSON.stringify({ s_error: 'missing s_path_glb' }), { status: 400, headers: { 'content-type': 'application/json' } });
            let s_path_stl = await f_convert_glb_to_stl(s_path_glb);
            // create o_fsnode and o_3dmodel records for the STL file
            let o_stat_stl = await Deno.stat(s_path_stl);
            let s_filename_stl = s_path_stl.slice(s_path_stl.lastIndexOf(s_ds) + 1);
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', {
                n_bytes: o_stat_stl.size,
                s_name: s_filename_stl,
                s_path_absolute: s_path_stl,
                b_ai_generated: true,
            });
            let o_3dmodel = f_v_crud__indb(s_db_create, 'a_o_3dmodel', {
                s_type: 'stl',
                n_o_fsnode_n_id: o_fsnode.n_id,
            });
            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_3dmodel');
            return new Response(JSON.stringify({ s_path_stl, n_id_fsnode: o_fsnode.n_id, n_id_3dmodel: o_3dmodel.n_id }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('convert-stl error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // generate text_from_image via VLM (fal-ai/bagel/understand)
    if (s_path === '/api/generate-text-from-image' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_path_image = o_body.s_path_image;
            let s_word = o_body.s_word || 'unknown';
            let n_o_fsnode_n_id = o_body.n_o_fsnode_n_id || null;
            if (!s_path_image) return new Response(JSON.stringify({ s_error: 'missing s_path_image' }), { status: 400, headers: { 'content-type': 'application/json' } });

            let s_folder_name = o_body.s_folder_name || '';
            let s_dir_output = s_folder_name ? s_dir__generated + s_ds + s_folder_name : s_dir__generated;
            try { await Deno.mkdir(s_dir_output, { recursive: true }); } catch { /* exists */ }
            let s_data_uri = await f_s_image_path_to_data_uri(s_path_image);
            console.log('generating text_from_image for:', s_word);
            let o_result = await f_o_fal_queue('fal-ai/bagel/understand', {
                image_url: s_data_uri,
                prompt: s_prompt__for_generating_text_from_image,
            });
            console.log('bagel/understand result:', JSON.stringify(o_result).slice(0, 500));

            let s_text_from_image = o_result.output || o_result.text || o_result.result || JSON.stringify(o_result);

            let s_sanitized = s_word.replace(/[^a-zA-Z0-9]/g, '_');
            let n_ts = Date.now();
            let s_filename = s_sanitized + '_text_from_image_' + n_ts + '.txt';
            let s_path_file = s_dir_output + s_ds + s_filename;
            let a_n_byte = new TextEncoder().encode(s_text_from_image);
            await Deno.writeFile(s_path_file, a_n_byte);

            let o_fsnode_data = {
                n_bytes: a_n_byte.length,
                s_name: s_filename,
                s_path_absolute: s_path_file,
                b_ai_generated: true,
            };
            if (n_o_fsnode_n_id) o_fsnode_data.n_o_fsnode_n_id = n_o_fsnode_n_id;
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', o_fsnode_data);

            f_v_crud__indb(s_db_create, 'a_o_fsnode_purpose', {
                s_text: 'text_from_image',
                n_o_fsnode_n_id: o_fsnode.n_id,
            });

            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_fsnode_purpose');

            console.log('text_from_image saved for:', s_word);
            return new Response(JSON.stringify({ s_text_from_image, s_path: s_path_file, n_id_fsnode: o_fsnode.n_id }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('generate-text-from-image error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // generate title, name, description, story text files via LLM (openrouter/router)
    if (s_path === '/api/generate-text' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_prompt_original = o_body.s_prompt_original;
            let s_text_from_image = o_body.s_text_from_image || '';
            let s_word = o_body.s_word || 'unknown';
            let n_o_fsnode_n_id = o_body.n_o_fsnode_n_id || null;
            let s_folder_name = o_body.s_folder_name || '';
            let s_dir_output = s_folder_name ? s_dir__generated + s_ds + s_folder_name : s_dir__generated;
            try { await Deno.mkdir(s_dir_output, { recursive: true }); } catch { /* exists */ }
            if (!s_prompt_original) return new Response(JSON.stringify({ s_error: 'missing s_prompt_original' }), { status: 400, headers: { 'content-type': 'application/json' } });

            let s_prompt_llm = s_prompt__for_generating_title_and_description
                .replace(/\{s_prompt_for_image\}/g, s_prompt_original)
                .replace(/\{s_prompt_for_generating_text_from_image\}/g, s_text_from_image);
            console.log('generating title/name/description/story for:', s_word);
            let o_result = await f_o_fal_queue('openrouter/router', {
                prompt: s_prompt_llm,
                model: 'google/gemini-2.5-flash',
            });
            console.log('openrouter/router result:', JSON.stringify(o_result).slice(0, 500));

            // extract text from response
            let s_response_text = o_result.output || o_result.text || o_result.result || JSON.stringify(o_result);

            // parse the JSON response for title, name, description, story
            let o_parsed = {};
            try {
                let s_json = s_response_text;
                let n_brace_start = s_json.indexOf('{');
                let n_brace_end = s_json.lastIndexOf('}');
                if (n_brace_start !== -1 && n_brace_end !== -1) {
                    s_json = s_json.slice(n_brace_start, n_brace_end + 1);
                }
                o_parsed = JSON.parse(s_json);
            } catch {
                o_parsed = { title: s_word, name: s_word, description: s_response_text, story: '' };
            }

            let s_title = o_parsed.title || o_parsed.s_title || '';
            let s_name = o_parsed.name || o_parsed.s_name || '';
            let s_description = o_parsed.description || o_parsed.s_description || '';
            let s_story = o_parsed.story || o_parsed.s_story || '';

            let s_sanitized = s_word.replace(/[^a-zA-Z0-9]/g, '_');
            let n_ts = Date.now();
            let a_o_created = [];

            // save each text field as a file with linked o_fsnode + o_fsnode_purpose
            let a_o_field = [
                { s_purpose: 'title', s_text: s_title },
                { s_purpose: 'name', s_text: s_name },
                { s_purpose: 'description', s_text: s_description },
                { s_purpose: 'story', s_text: s_story },
            ];
            for (let o_field of a_o_field) {
                let s_filename = s_sanitized + '_' + o_field.s_purpose + '_' + n_ts + '.txt';
                let s_path_file = s_dir_output + s_ds + s_filename;
                let a_n_byte = new TextEncoder().encode(o_field.s_text);
                await Deno.writeFile(s_path_file, a_n_byte);

                let o_fsnode_data = {
                    n_bytes: a_n_byte.length,
                    s_name: s_filename,
                    s_path_absolute: s_path_file,
                    b_ai_generated: true,
                };
                if (n_o_fsnode_n_id) o_fsnode_data.n_o_fsnode_n_id = n_o_fsnode_n_id;
                let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', o_fsnode_data);

                f_v_crud__indb(s_db_create, 'a_o_fsnode_purpose', {
                    s_text: o_field.s_purpose,
                    n_o_fsnode_n_id: o_fsnode.n_id,
                });
                a_o_created.push({ s_purpose: o_field.s_purpose, s_text: o_field.s_text, s_path: s_path_file, n_id_fsnode: o_fsnode.n_id });
            }

            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_fsnode_purpose');

            console.log('title/name/description/story saved for:', s_word);
            return new Response(JSON.stringify({ s_title, s_name, s_description, s_story, a_o_created }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('generate-text error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // serve static file
    if (s_path === '/') {
        s_path = '/index.html';
    }

    try {
        let s_path_file = `${s_dir__static}${s_path}`.replace(/\//g, s_ds);
        let a_n_byte = await Deno.readFile(s_path_file);
        let s_content_type = f_s_content_type(s_path);
        return new Response(a_n_byte, {
            headers: { 'content-type': s_content_type },
        });
    } catch {
        return new Response('Not Found', { status: 404 });
    }
};

Deno.serve({
    port: n_port,
    onListen() {
        console.log(`server running on http://localhost:${n_port}`);
    },
}, f_handler);
