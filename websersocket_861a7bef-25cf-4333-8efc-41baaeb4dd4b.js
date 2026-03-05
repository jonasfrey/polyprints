// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
import {
    f_db_delete_table_data,
    f_generate_model_constructors_for_cli_languages,
    f_init_db,
    f_v_crud__indb,
} from "./serverside/database_functions.js";
import { f_a_o_fsnode, f_o_uttdatainfo__read_or_create, f_v_result_from_o_wsmsg } from "./serverside/functions.js";
import { f_init_python, f_convert_glb_to_stl, f_convert_raw_to_png } from "./serverside/cli_functions.js";
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
    s_cults3d_username,
    s_cults3d_api_key,
    s_api_key__fileslink,
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

// --- files.link helpers ---
let s_fileslink_project_id = null;
let s_fileslink_folder_id = null;

let f_ensure_fileslink_folder = async function() {
    if (s_fileslink_folder_id) return;
    let o_headers = { 'Authorization': s_api_key__fileslink, 'Content-Type': 'application/json', 'accept': 'application/json' };

    // find or create project
    let o_resp_projects = await fetch('https://api.files.link/v1/projects/1', { headers: o_headers });
    let o_projects = await o_resp_projects.json();
    if (!o_projects.success) throw new Error('files.link list projects failed: ' + (o_projects.message || o_projects.error));
    // API returns { projects: { projects: [...] } } (paginated)
    let a_o_project = o_projects.projects?.projects || o_projects.projects || [];
    if (!Array.isArray(a_o_project)) a_o_project = [];
    let o_project = a_o_project.find(function(p) { return p.title === 'polyprints'; });
    if (o_project) {
        s_fileslink_project_id = o_project.id;
    } else {
        let o_resp = await fetch('https://api.files.link/v1/projects', { method: 'POST', headers: o_headers, body: JSON.stringify({ title: 'polyprints' }) });
        let o_data = await o_resp.json();
        if (!o_data.success) throw new Error('files.link create project failed: ' + (o_data.message || ''));
        s_fileslink_project_id = o_data.projectId;
        console.log('files.link: created project', s_fileslink_project_id);
    }

    // find or create folder
    let o_resp_folders = await fetch('https://api.files.link/v1/folders/project/' + s_fileslink_project_id, { headers: o_headers });
    let o_folders = await o_resp_folders.json();
    if (!o_folders.success) throw new Error('files.link list folders failed: ' + (o_folders.message || o_folders.error));
    // API returns { data: { folders: [...] } } or { data: [...] }
    let a_o_folder = o_folders.data?.folders || o_folders.data || [];
    if (!Array.isArray(a_o_folder)) a_o_folder = [];
    let o_folder = a_o_folder.find(function(f) { return f.title === 'uploads'; });
    if (o_folder) {
        s_fileslink_folder_id = o_folder.id;
    } else {
        let o_resp = await fetch('https://api.files.link/v1/folders', { method: 'POST', headers: o_headers, body: JSON.stringify({ title: 'uploads', projectId: s_fileslink_project_id, isPrivate: false }) });
        let o_data = await o_resp.json();
        if (!o_data.success) throw new Error('files.link create folder failed: ' + (o_data.message || ''));
        s_fileslink_folder_id = o_data.folderId;
        console.log('files.link: created folder', s_fileslink_folder_id);
    }
};

// upload bytes to files.link, create permanent link, return public URL
let f_s_fileslink_upload = async function(a_n_byte, s_filename, s_mime_type) {
    let o_headers = { 'Authorization': s_api_key__fileslink, 'Content-Type': 'application/json', 'accept': 'application/json' };
    await f_ensure_fileslink_folder();

    // get presigned upload URL
    let o_resp_presign = await fetch('https://api.files.link/v1/files/' + s_fileslink_folder_id, {
        method: 'POST',
        headers: o_headers,
        body: JSON.stringify({ filesMetadata: [{ name: s_filename, size: a_n_byte.length, mimeType: s_mime_type || 'application/octet-stream' }] }),
    });
    let o_presign = await o_resp_presign.json();
    if (!o_presign.success || !o_presign.urls || !o_presign.urls[0]) {
        throw new Error('files.link presign failed: ' + JSON.stringify(o_presign));
    }
    let s_presigned_url = o_presign.urls[0].url;

    // PUT file bytes to S3
    let o_resp_put = await fetch(s_presigned_url, {
        method: 'PUT',
        headers: { 'Content-Length': String(a_n_byte.length) },
        body: a_n_byte,
    });
    if (!o_resp_put.ok) {
        let s_body = await o_resp_put.text();
        throw new Error('files.link S3 PUT failed (' + o_resp_put.status + '): ' + s_body.slice(0, 200));
    }

    // find the file ID by listing folder files
    let o_resp_files = await fetch('https://api.files.link/v1/files/folder/' + s_fileslink_folder_id, { headers: o_headers });
    let o_files = await o_resp_files.json();
    if (!o_files.success) throw new Error('files.link list files failed: ' + (o_files.message || o_files.error));
    // API returns { data: { files: [...] } } or { data: [...] }
    let a_o_files = o_files.data?.files || o_files.data || [];
    if (!Array.isArray(a_o_files)) a_o_files = [];
    let o_file = a_o_files.find(function(f) { return f.fileName === s_filename; });
    if (!o_file) throw new Error('files.link: uploaded file not found in folder listing');

    // create permanent link
    let o_resp_plink = await fetch('https://api.files.link/v1/p', {
        method: 'POST',
        headers: o_headers,
        body: JSON.stringify({ fileId: o_file.id }),
    });
    let o_plink = await o_resp_plink.json();
    if (!o_plink.success) throw new Error('files.link permanent link failed: ' + (o_plink.message || ''));

    let s_public_url = 'https://api.files.link/v1/p/' + o_plink.link + '/' + encodeURIComponent(s_filename);
    console.log('files.link: uploaded', s_filename, '->', s_public_url);
    return s_public_url;
};

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

    // convert RAW images to PNG in a folder
    if (s_path === '/api/convert-raw-to-png' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let s_path_folder = o_body.s_path_folder;
            if (!s_path_folder) return new Response(JSON.stringify({ s_error: 'missing s_path_folder' }), { status: 400, headers: { 'content-type': 'application/json' } });
            let f_on_progress = function(s_message) {
                let s_msg = JSON.stringify(
                    f_o_wsmsg(
                        o_wsmsg__logmsg.s_name,
                        f_o_logmsg(
                            s_message,
                            true,
                            true,
                            s_o_logmsg_s_type__info,
                            Date.now(),
                            5000
                        )
                    )
                );
                for (let o_sock of a_o_socket) {
                    if (o_sock.readyState === WebSocket.OPEN) {
                        o_sock.send(s_msg);
                    }
                }
            };
            let o_result = await f_convert_raw_to_png(s_path_folder, f_on_progress);
            return new Response(JSON.stringify(o_result), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('convert-raw-to-png error:', o_error.message);
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

    // upload files to files.link and return permanent public URLs
    if (s_path === '/api/fileslink-upload' && o_request.method === 'POST') {
        try {
            if (!s_api_key__fileslink) {
                return new Response(JSON.stringify({ s_error: 'Files.link API key not configured. Set S_API_KEY_FILESLINK in .env' }), { status: 400, headers: { 'content-type': 'application/json' } });
            }

            let o_body = await o_request.json();
            let a_s_path = o_body.a_s_path || [];
            if (!a_s_path.length) {
                return new Response(JSON.stringify({ s_error: 'No file paths provided' }), { status: 400, headers: { 'content-type': 'application/json' } });
            }

            let a_o_result = [];
            for (let s_file_path of a_s_path) {
                try {
                    let a_n_byte = await Deno.readFile(s_file_path);
                    let s_filename = s_file_path.split(s_ds).pop();
                    // deduplicate filename with timestamp
                    let s_ext = s_filename.includes('.') ? '.' + s_filename.split('.').pop() : '';
                    let s_base = s_ext ? s_filename.slice(0, -s_ext.length) : s_filename;
                    let s_unique_name = s_base + '_' + Date.now() + s_ext;
                    // guess mime type
                    let s_mime = 'application/octet-stream';
                    let s_lower = s_filename.toLowerCase();
                    if (s_lower.endsWith('.png')) s_mime = 'image/png';
                    else if (s_lower.endsWith('.jpg') || s_lower.endsWith('.jpeg')) s_mime = 'image/jpeg';
                    else if (s_lower.endsWith('.webp')) s_mime = 'image/webp';
                    else if (s_lower.endsWith('.stl')) s_mime = 'model/stl';
                    else if (s_lower.endsWith('.glb')) s_mime = 'model/gltf-binary';
                    else if (s_lower.endsWith('.3mf')) s_mime = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
                    else if (s_lower.endsWith('.txt')) s_mime = 'text/plain';

                    let s_url = await f_s_fileslink_upload(a_n_byte, s_unique_name, s_mime);
                    a_o_result.push({ s_path: s_file_path, s_filename: s_filename, s_url: s_url });
                } catch (o_err) {
                    console.error('files.link upload failed for', s_file_path, ':', o_err.message);
                    a_o_result.push({ s_path: s_file_path, s_filename: s_file_path.split(s_ds).pop(), s_error: o_err.message });
                }
            }

            return new Response(JSON.stringify({ success: true, a_o_result: a_o_result }), { headers: { 'content-type': 'application/json' } });
        } catch (o_error) {
            console.error('fileslink-upload error:', o_error.message);
            return new Response(JSON.stringify({ s_error: o_error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
        }
    }

    // upload to Cults3D via GraphQL API
    if (s_path === '/api/cults3d-upload' && o_request.method === 'POST') {
        try {
            if (!s_cults3d_username || !s_cults3d_api_key) {
                return new Response(JSON.stringify({ s_error: 'Cults3D credentials not configured. Set S_CULTS3D_USERNAME and S_CULTS3D_API_KEY in .env' }), { status: 400, headers: { 'content-type': 'application/json' } });
            }

            let o_form = await o_request.formData();
            let s_name = o_form.get('s_name') || '';
            let s_description = o_form.get('s_description') || '';
            let s_tags = o_form.get('s_tags') || '';
            let s_path_thumbnail = o_form.get('s_path_thumbnail') || '';
            let s_path_stl = o_form.get('s_path_stl') || '';
            let o_file_3mf = o_form.get('o_file_3mf');
            let n_o_fsnode_n_id = o_form.get('n_o_fsnode_n_id');
            if (n_o_fsnode_n_id) n_o_fsnode_n_id = Number(n_o_fsnode_n_id);

            // upload files to files.link for public URLs
            let a_s_image_url = [];
            let a_s_file_url = [];

            // upload thumbnail if provided
            if (s_path_thumbnail) {
                let a_n_byte = await Deno.readFile(s_path_thumbnail);
                let s_filename = s_path_thumbnail.split(s_ds).pop();
                let s_unique = s_filename.replace(/(\.\w+)$/, '_' + Date.now() + '$1');
                let s_url = await f_s_fileslink_upload(a_n_byte, s_unique, 'image/png');
                a_s_image_url.push(s_url);
                console.log('cults3d: thumbnail uploaded to', s_url);
            }

            // upload STL if provided
            if (s_path_stl) {
                let a_n_byte = await Deno.readFile(s_path_stl);
                let s_filename = s_path_stl.split(s_ds).pop();
                let s_unique = s_filename.replace(/(\.\w+)$/, '_' + Date.now() + '$1');
                let s_url = await f_s_fileslink_upload(a_n_byte, s_unique, 'model/stl');
                a_s_file_url.push(s_url);
                console.log('cults3d: STL uploaded to', s_url);
            }

            // upload .3mf if provided (from form data)
            if (o_file_3mf && o_file_3mf instanceof File) {
                let a_n_byte = new Uint8Array(await o_file_3mf.arrayBuffer());
                let s_unique = o_file_3mf.name.replace(/(\.\w+)$/, '_' + Date.now() + '$1');
                let s_url = await f_s_fileslink_upload(a_n_byte, s_unique, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
                a_s_file_url.push(s_url);
                console.log('cults3d: 3MF uploaded to', s_url);
            }

            // call Cults3D GraphQL createCreation mutation
            let s_auth = btoa(s_cults3d_username + ':' + s_cults3d_api_key);

            let s_query = `mutation CreateCreation(
                $name: String!
                $description: String!
                $imageUrls: [String!]!
                $fileUrls: [String!]!
                $categoryId: ID!
                $subCategoryIds: [ID!]
                $downloadPrice: Float!
                $currency: CurrencyEnum!
                $licenseCode: String
                $locale: LocaleEnum!
            ) {
                createCreation(
                    name: $name
                    description: $description
                    imageUrls: $imageUrls
                    fileUrls: $fileUrls
                    categoryId: $categoryId
                    subCategoryIds: $subCategoryIds
                    downloadPrice: $downloadPrice
                    currency: $currency
                    licenseCode: $licenseCode
                    locale: $locale
                ) {
                    creation { id url(locale: EN) }
                    errors
                }
            }`;

            let o_variables = {
                name: s_name,
                description: s_description,
                imageUrls: a_s_image_url,
                fileUrls: a_s_file_url,
                categoryId: 'Q2F0ZWdvcnkvMjM=',
                subCategoryIds: [],
                downloadPrice: 0,
                currency: 'EUR',
                licenseCode: 'cc_by',
                locale: 'EN',
            };

            console.log('cults3d: calling createCreation for', s_name);
            let o_resp_gql = await fetch('https://cults3d.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + s_auth,
                },
                body: JSON.stringify({ query: s_query, variables: o_variables }),
            });

            let o_gql_result = await o_resp_gql.json();
            console.log('cults3d: API response:', JSON.stringify(o_gql_result).slice(0, 500));

            if (o_gql_result.errors || o_gql_result.data?.createCreation?.errors?.length) {
                let s_err = JSON.stringify(o_gql_result.errors || o_gql_result.data.createCreation.errors);
                throw new Error('Cults3D API error: ' + s_err);
            }

            let o_creation = o_gql_result.data?.createCreation?.creation;

            // save cults3d.txt alongside the model files
            let s_cults_info = JSON.stringify({
                s_cults3d_id: o_creation?.id,
                s_cults3d_url: o_creation?.url,
                s_cults3d_name: o_creation?.name,
                n_ts_ms_uploaded: Date.now(),
                s_name: s_name,
            }, null, 2);

            let s_sanitized = s_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
            let s_filename_cults = s_sanitized + '_cults3d_' + Date.now() + '.txt';
            let s_path_cults = s_dir__generated + s_ds + s_filename_cults;
            let a_n_byte = new TextEncoder().encode(s_cults_info);
            await Deno.writeFile(s_path_cults, a_n_byte);
            console.log('cults3d: info saved to', s_path_cults);

            // create fsnode + purpose for tracking
            let o_fsnode_data = {
                n_bytes: a_n_byte.length,
                s_name: s_filename_cults,
                s_path_absolute: s_path_cults,
                b_ai_generated: false,
            };
            if (n_o_fsnode_n_id) o_fsnode_data.n_o_fsnode_n_id = n_o_fsnode_n_id;
            let o_fsnode = f_v_crud__indb(s_db_create, 'a_o_fsnode', o_fsnode_data);
            f_v_crud__indb(s_db_create, 'a_o_fsnode_purpose', {
                s_text: 'cults3d',
                n_o_fsnode_n_id: o_fsnode.n_id,
            });
            f_broadcast_db_data('a_o_fsnode');
            f_broadcast_db_data('a_o_fsnode_purpose');

            return new Response(JSON.stringify({
                o_creation: o_creation,
                o_fsnode: o_fsnode,
            }), { headers: { 'content-type': 'application/json' } });

        } catch (o_error) {
            console.error('cults3d-upload error:', o_error.message);
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
