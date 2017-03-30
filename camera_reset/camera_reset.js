"use strict"

// register the application module
b4w.register("camera_reset_app", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_cfg       = require("config");
var m_data      = require("data");
var m_preloader = require("preloader");
var m_ver       = require("version");
var m_scs       = require("scenes");
var m_ctl       = require("controls");
var m_time      = require("time");
var m_cam       = require("camera");
var m_trans     = require("transform");
var m_vec3      = require("vec3");
// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path
var RESET_TIME = 5.0;
var THRESHOLD = 0.01;

var _camera_data = {
    default_position : null,
    default_pivot : null,
    default_dist : 0,
    idle_time : 0.0
}
var _vec3_tmp = new Float32Array(3);
var _vec3_tmp2 = new Float32Array(3);
/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: false,
        console_verbose: true,
        autoresize: true,
        physics_enabled: false
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_preloader.create_preloader();

    // ignore right-click on the canvas element
    canvas_elem.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load("assets/camera_reset.json", load_cb, preloader_cb);
}

/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}

/**
 * callback executed when the scene data is loaded
 */
function load_cb(data_id, success) {

    if (!success) {
        console.log("b4w load failure");
        return;
    }

    m_app.enable_camera_controls();

    // place your code here
    var cam_obj = m_scs.get_active_camera();
    extract_def_camera_data(cam_obj);
    check_camera_movements(cam_obj);
    check_idle_time(cam_obj);
}

function get_camera_data() {
    return _camera_data;
}

function extract_def_camera_data(cam_obj) {
    var cam_data = get_camera_data();
    cam_data.default_dist = m_cam.target_get_distance(cam_obj);
    cam_data.default_pivot = m_cam.target_get_pivot(cam_obj);
    cam_data.default_position = m_trans.get_translation(cam_obj);

    m_vec3.copy(cam_data.default_position, _vec3_tmp);
    m_vec3.copy(cam_data.default_position, _vec3_tmp2);
}

function check_camera_movements(cam_obj) {
    var cam_move_sensor = m_ctl.create_motion_sensor(cam_obj, 0.5, 0.5);
    var cam_data = get_camera_data();
    var time_label_elem = document.getElementById("time_info");
    var logic_func = function(s) {
        return s[0];
    }
    var cam_move_cb = function(obj, id, pulse) {
        var curr_pos = m_trans.get_translation(cam_obj, _vec3_tmp2);
        var prev_pos = _vec3_tmp;
        if (pulse == 1) {
            cam_data.idle_time = 0.0;
            time_label_elem.innerText = "Idle time: 0.0";
        } else if (m_vec3.dist(curr_pos, prev_pos) > THRESHOLD)
            cam_data.idle_time = m_time.get_timeline();
        m_vec3.copy(curr_pos, prev_pos);
    }
    m_ctl.create_sensor_manifold(cam_obj, "CAMERA_MOVE_MANIFOLD", m_ctl.CT_TRIGGER,
            [cam_move_sensor], logic_func, cam_move_cb);
}

function check_idle_time(cam_obj) {
    var time_sensor = m_ctl.create_timeline_sensor();
    var time_label_elem = document.getElementById("time_info");
    var logic_func = function(s) {
        return true;
    }
    var time_cb = function(obj, id, pulse) {
        var curr_time = m_ctl.get_sensor_value(obj, id, 0);
        var cam_data = get_camera_data();
        if (cam_data.idle_time > 0.0) {
            var delta_idle_time = curr_time - cam_data.idle_time;
            time_label_elem.innerText = "Idle time: " + delta_idle_time.toFixed(2);
            if (delta_idle_time >= RESET_TIME)
                reset_camera_position(cam_obj);
        }
    }
    m_ctl.create_sensor_manifold(cam_obj, "CAMERA_RESET_MANIFOLD", m_ctl.CT_CONTINUOUS,
            [time_sensor], logic_func, time_cb);
}

function reset_camera_position(cam_obj) {
    var cam_data = get_camera_data();
    m_cam.target_set_trans_pivot(cam_obj, cam_data.default_position, cam_data.default_pivot);
    m_cam.target_set_distance(cam_obj, cam_data.default_dist);
    cam_data.idle_time = -1.0;
}


});

// import the app module and start the app by calling the init method
b4w.require("camera_reset_app").init();
