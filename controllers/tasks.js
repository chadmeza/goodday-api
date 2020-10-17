const Task = require('../models/Task');

exports.getTasks = async (req, res, next) => {
    try {
        // get all tasks for the currently logged-in user
        const tasks = await Task.find({ user: req.user._id });

        // return a 200 with the tasks
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

exports.createTask = async (req, res, next) => {
    try {
        // create a task object
        const task = {
            title: req.body.title,
            user: req.user._id
        };
        
        // save the new task in the DB
        const newTask = await Task.create(task);

        // return a 201 with the new task
        res.status(201).json({
            success: true,
            data: newTask
        });
    } catch(error) {
        next(error);
    }
};

exports.getTask = async (req, res, next) => {
    try {
        // find a task with the given ID
        const task = await Task.findById(req.params.id);

        // if a task cannot be found, return a 404
        if (!task) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'Task could not be found.'
            });
        }

        // if the task does not belong to the currently logged-in user, return a 401
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User is not authorized to access this task.'
            });
        }

        // return a 200 with the task
        res.status(200).json({
            success: true,
            data: task
        });
    } catch(error) {
        next(error);
    }
};

exports.updateTask = async (req, res, next) => {
    try {
        // find a task with the given ID
        const task = await Task.findById(req.params.id);

        // if a task cannot be found, return a 404
        if (!task) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'Task could not be found.'
            });
        }

        // if the task does not belong to the currently logged-in user, return a 401
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User is not authorized to update this task.'
            });
        }

        // update the task with the given data
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id, 
            { title: req.body.title }, 
            { new: true }
        );

        // return a 200 with the updated task
        res.status(200).json({
            success: true,
            data: updatedTask
        });
    } catch(error) {
        next(error);
    }
};

exports.deleteTask = async (req, res, next) => {
    try {
        // find a task with the given ID
        const task = await Task.findById(req.params.id);        

        // if a task cannot be found, return a 404
        if (!task) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'Task could not be found.'
            });
        }

        // if the task does not belong to the currently logged-in user, return a 401
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User is not authorized to delete this task.'
            });
        }

        // delete the task from the DB
        const deletedTask = await Task.findByIdAndDelete(req.params.id);

        // return a 200 with the deleted task
        res.status(200).json({
            success: true,
            data: deletedTask
        });
    } catch(error) {
        next(error);
    }
};