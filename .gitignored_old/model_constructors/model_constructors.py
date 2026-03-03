# Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

# Auto-generated on 2026-03-03T12:19:10.947Z model constructors

def f_o_student(data):
    return {
        'n_id': data.get('n_id'),
        's_name': data.get('s_name'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_course(data):
    return {
        'n_id': data.get('n_id'),
        's_name': data.get('s_name'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_course_o_student(data):
    return {
        'n_id': data.get('n_id'),
        'n_o_course_n_id': data.get('n_o_course_n_id'),
        'n_o_student_n_id': data.get('n_o_student_n_id'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_wsclient(data):
    return {
        'n_id': data.get('n_id'),
        's_ip': data.get('s_ip'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_fsnode(data):
    return {
        'n_id': data.get('n_id'),
        'n_o_fsnode_n_id': data.get('n_o_fsnode_n_id'),
        'n_bytes': data.get('n_bytes'),
        's_name': data.get('s_name'),
        's_path_absolute': data.get('s_path_absolute'),
        'b_ai_generated': data.get('b_ai_generated'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_keyvalpair(data):
    return {
        'n_id': data.get('n_id'),
        's_key': data.get('s_key'),
        's_value': data.get('s_value'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_utterance(data):
    return {
        'n_id': data.get('n_id'),
        's_text': data.get('s_text'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_o_fsnode_n_id': data.get('n_o_fsnode_n_id'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_image(data):
    return {
        'n_id': data.get('n_id'),
        'n_o_fsnode_n_id': data.get('n_o_fsnode_n_id'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_3dmodel(data):
    return {
        'n_id': data.get('n_id'),
        's_type': data.get('s_type'),
        'n_o_fsnode_n_id': data.get('n_o_fsnode_n_id'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_imagegeneratorsubject(data):
    return {
        'n_id': data.get('n_id'),
        's_name': data.get('s_name'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_imagegeneratorprompt(data):
    return {
        'n_id': data.get('n_id'),
        's_label': data.get('s_label'),
        's_promptgenerator_prompt': data.get('s_promptgenerator_prompt'),
        's_prompt_template': data.get('s_prompt_template'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_imagegeneratorprompt_o_imagegeneratorsubject(data):
    return {
        'n_id': data.get('n_id'),
        'n_o_imagegeneratorprompt_n_id': data.get('n_o_imagegeneratorprompt_n_id'),
        'n_o_imagegeneratorsubject_n_id': data.get('n_o_imagegeneratorsubject_n_id'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

def f_o_fsnode_purpose(data):
    return {
        'n_id': data.get('n_id'),
        's_text': data.get('s_text'),
        'n_o_fsnode_n_id': data.get('n_o_fsnode_n_id'),
        'n_ts_ms_created': data.get('n_ts_ms_created'),
        'n_ts_ms_updated': data.get('n_ts_ms_updated'),
    }

