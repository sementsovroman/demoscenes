"use strict"

// register the application module
b4w.register("cam_moving_test_app", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_cfg       = require("config");
var m_data      = require("data");
var m_preloader = require("preloader");
var m_ver       = require("version");
var m_cam_anim  = require("camera_anim");
var m_scs       = require("scenes");
var m_cam       = require("camera");
var m_trans     = require("transform");
var m_vec3      = require("vec3");
// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path

var _vec3_tmp = new Float32Array(3);
var _vec3_tmp2 = new Float32Array(3);
var _vec3_tmp3 = new Float32Array(3);
/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: DEBUG,
        console_verbose: DEBUG,
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
    m_data.load("assets/cam_moving_test.json", load_cb, preloader_cb);
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
    var start_anim_buttom = document.getElementById("start_anim");
    start_anim.addEventListener("click", function(e) {
        var cam_obj = m_scs.get_active_camera();

        var final_cam_pos_obj = m_scs.get_object_by_name("cam_final_pos");
        var final_target_obj = m_scs.get_object_by_name("cam_final_target");

        rotate_final_cam_pos_object_to_final_target(final_cam_pos_obj, final_target_obj);

        m_cam.static_setup(cam_obj);

        var set_target_mode = function() {
            var target = m_trans.get_translation(final_target_obj, _vec3_tmp2);
            m_cam.target_setup(cam_obj, {pivot : target});
        }

        m_cam_anim.move_camera_to_point(cam_obj, final_cam_pos_obj, 5.0, 0.5, set_target_mode);
    }, false);


}

function rotate_final_cam_pos_object_to_final_target(final_pos_obj, final_target_obj) {
    var final_pos = m_trans.get_translation(final_pos_obj, _vec3_tmp);
    var final_target = m_trans.get_translation(final_target_obj, _vec3_tmp2);

    m_cam.static_set_look_at(final_pos_obj, final_pos, final_target);
    m_cam.correct_up(final_pos_obj);
}


});

// import the app module and start the app by calling the init method
b4w.require("cam_moving_test_app").init();
