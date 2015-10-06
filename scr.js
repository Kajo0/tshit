/**
 * Groups:
 *  1 - day
 *  2 - month
 *  3 - year
 */
var DATE_PATTERN = /^(\d{2,2})\.(\d{2,2})\.(\d{4,4})/;

/**
 * Groups:
 *  1 - hours
 *  2 - minutes
 *  3 - seconds
 *  4 - project
 *  5 - task name
 */
var TASK_PATTERN = /(\d{1,2}):(\d{2,2}):(\d{2,2})\s+-\s+\[(.+)\]\s+(.*)$/

var AUTHORS_RIGHTS_MARK = /^\s*\$/;

function Task(line) {
    var matches = line.match(TASK_PATTERN);
    this.hours = matches[1];
    this.minutes = matches[2];
    this.seconds = matches[3];
    this.project = matches[4];
    this.taskName = matches[5];
    this.authorsRights = Task.checkAuthorsRights(this.taskName);
}
Task.checkAuthorsRights = function(taskName) {
    return taskName.search(AUTHORS_RIGHTS_MARK) != -1;
}

function WorkDay(line) {
    var matches = line.match(DATE_PATTERN);
    this.day = matches[1];
    this.month = matches[2];
    this.year = matches[3];
    this.date = new Date(this.year, this.month, this.day);
    this.tasks = [];

    this.addTask = function(task) {
        this.tasks.push(task);
    }
}

function TimeSheet() {
    this.workDays = [];

    this.addWorkDay = function(workDay) {
        this.workDays.push(workDay);
    }
    this.addTaskToWorkDay = function(task) {
        this.workDays[this.workDays.length - 1].addTask(task);
    }

    this.toString = function() {
        var str = "";
        for (d in this.workDays) {
            var workDay = this.workDays[d];
            str += workDay.day + '-' + workDay.month + '-' + workDay.year + '\n';
            for (t in workDay.tasks) {
                var task = workDay.tasks[t];
                str += '\t' + '[' + task.project + '] ' + task.taskName + '\n';
            }
            str += '\n';
        }

        return str;
    }
}

function process(input) {
    var timeSheet = new TimeSheet();
    var lines = input.split("\n");
    for (l in lines) {
        var line = lines[l];
        if (line.search(DATE_PATTERN) != -1) {
            // HEADER
            var workDay = new WorkDay(line);
            timeSheet.addWorkDay(workDay);
        } else if (line.search(TASK_PATTERN) != -1) {
            // TASK
            var task = new Task(line);
            timeSheet.addTaskToWorkDay(task);
        }
    }

    console.log(timeSheet);

    return timeSheet.toString();
}

$(function() {
    $('#process').on('click', function() {
        var $input = $('#input');
        var $output = $('#output');
        $output.val(process($input.val()));
    });
});