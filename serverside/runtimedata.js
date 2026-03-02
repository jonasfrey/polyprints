// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// derive project root from this file's location (serverside/ -> parent)
let n_idx__last_sep = Math.max(
    import.meta.dirname.lastIndexOf('/'),
    import.meta.dirname.lastIndexOf('\\')
);
let s_root_dir = import.meta.dirname.slice(0, n_idx__last_sep);

// directory separator
let s_ds = '/';
// if windows is detected as platform, change to backslash
if (Deno.build.os === 'windows') {
    s_ds = '\\';
}

// all .env variables gathered here, each script imports what it needs from this file
let n_port = parseInt(Deno.env.get('PORT') ?? '8000');
let s_dir__static = Deno.env.get('STATIC_DIR') ?? './localhost';
let s_path__database = Deno.env.get('DB_PATH') ?? './.gitignored/app.db';
let s_path__model_constructor_cli_language = Deno.env.get('MODEL_CONSTRUCTORS_CLI_LANGUAGES_PATH') ?? './.gitignored/model_constructors/';
let s_uuid = Deno.env.get('S_UUID') ?? '';
let s_bin__python = Deno.env.get('BIN_PYTHON') ?? 'python3';
let s_path__venv = Deno.env.get('PATH_VENV') ?? './venv';

let s_bin__glances = Deno.env.get('BIN_GLANCES') ?? 'glances';

let s_api_key__fal_ai = Deno.env.get('S_API_KEY_FAL_AI') ?? '';

let a_s_animal = [
 "cat",
  "fox",
  "elephant",
  "wolf",
  "rabbit",
  "bear",
  "deer",
  "owl",
  "whale",
  "lion",
  "penguin",
  "eagle",
  "turtle",
  "horse",
  "dolphin",
  "cat",
  "rhinoceros",
  "flamingo",
  "gorilla",
  "shark",
  "frog",
  "giraffe",
  "octopus",
  "koala",
  "parrot",
  "crocodile",
  "chameleon",
  "hedgehog",
  "bull",
  "swan",
  "scorpion"
];
// let s_prompt__default = `Low-polygon animal figurine of a [s], geometric faceted surfaces, minimal triangle mesh style, smooth solid matte colors, subtle pastel tones, stylized miniature sculpture, clean hard edges between flat polygonal faces, isometric view, 45-degree angle, orthographic camera, no perspective distortion, flat shading, isolated on a pure white background, clean cutout, no shadows, no background elements, centered composition, high-key lighting, sharp focus, PNG style transparent-ready renderLow-polygon animal figurine, geometric faceted surfaces, minimal triangle mesh style, smooth solid matte colors, subtle pastel tones, stylized miniature sculpture, clean hard edges between flat polygonal faces, isometric view, 45-degree angle, orthographic camera, no perspective distortion, flat shading, isolated on a pure white background, clean cutout, no shadows, no background elements, centered composition, high-key lighting, sharp focus, PNG style transparent-ready render`
let s_prompt__default = `Low-polygon [s] figurine, geometric faceted surfaces, minimal triangle mesh style, smooth solid matte colors, subtle pastel tones, stylized miniature sculpture, chunky simplified proportions, clean hard edges between flat polygonal faces, isometric view, 45-degree angle, orthographic camera, no perspective distortion, flat shading, isolated on a pure white background, clean cutout, no shadows, no background elements, centered composition, high-key lighting, sharp focus, PNG style transparent-ready render`;


export {
    s_root_dir,
    s_ds,
    n_port,
    s_dir__static,
    s_path__database,
    s_path__model_constructor_cli_language,
    s_uuid,
    s_bin__python,
    s_path__venv,
    s_bin__glances,
    s_api_key__fal_ai,
    a_s_animal,
    s_prompt__default
}