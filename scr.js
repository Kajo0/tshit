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
var TASK_PATTERN = /(\d{1,2}):(\d{2,2}):(\d{2,2})\s+-\s+\[(.+?)\]\s+(.*)$/

var IGNORE_MARK = /\[.+?\]\s*#/;

var AUTHORS_RIGHTS_MARK = /^\s*\$\s*/;

var OUTPUT_DATE_FORMAT = 'YYYY-MM-DD';

function Task(line) {
    var matches = line.match(TASK_PATTERN);
    this.hours = parseInt(matches[1]);
    this.minutes = parseInt(matches[2]);
    this.seconds = parseInt(matches[3]);
    this.project = matches[4];
    this.taskName = matches[5];
    this.authorsRights = Task.checkAuthorsRights(this.taskName);
    this.date;

    this.duration = function(round) {
        var duration = moment.duration();
        duration.add(this.hours, 'H');
        duration.add(this.minutes, 'm');
        duration.add(this.seconds, 's');

        if (typeof(round) === 'undefined' && duration.seconds() != 0) {
            duration.subtract(duration.seconds(), 's');
            duration.add(1, 'm');
        }

        return duration;
    }
}
Task.checkAuthorsRights = function(taskName) {
    return taskName.search(AUTHORS_RIGHTS_MARK) != -1;
}

function WorkDay(line) {
    var matches = line.match(DATE_PATTERN);
    this.day = parseInt(matches[1]);
    this.month = parseInt(matches[2]);
    this.year = parseInt(matches[3]);
    this.date = new Date(this.year, this.month - 1, this.day);
    this.tasks = [];

    this.addTask = function(task) {
        task.date = this.date;
        this.tasks.push(task);
    }
    this.summarizeHours = function() {
        var sum = moment.duration();
        for (t in this.tasks) {
            var task = this.tasks[t];
            sum.add(task.duration());
        }
        return sum;
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
}

function ProjectSheet() {
    this.taskMap = {};

    this.addTask = function(task) {
        if (this.taskMap[task.project] === undefined) {
            this.taskMap[task.project] = [];
        }
        this.taskMap[task.project].push(task);
    }

    this.toString = function() {
        var str = "";
        for (name in this.taskMap) {
            var tasks = this.taskMap[name];
            str += '\t*** ' + name + ' ***\n';
            for (t in tasks) {
                var task = tasks[t];
                var time = moment.utc(task.duration().asMilliseconds());
                str += moment(task.date).format(OUTPUT_DATE_FORMAT) +
                       ' | ' + time.format('HH:mm') +
                       ' | ' + (task.authorsRights ? 1 : 0) +
                       ' | ' + task.taskName.replace(AUTHORS_RIGHTS_MARK, '') + '\n';
            }
            str += '\n';
        }
        return str;
    }
}

function processTimeSheet(input) {
    var timeSheet = new TimeSheet();
    var lines = input.split("\n");
    for (l in lines) {
        var line = lines[l];
        if (line.search(DATE_PATTERN) != -1) {
            // HEADER
            var workDay = new WorkDay(line);
            timeSheet.addWorkDay(workDay);
        } else if (line.search(IGNORE_MARK) != -1) {
            // IGNORE
        } else if (line.search(TASK_PATTERN) != -1) {
            // TASK
            var task = new Task(line);
            timeSheet.addTaskToWorkDay(task);
        }
    }
    return timeSheet;
}

function groupByProject(timeSheet) {
    var projectSheet = new ProjectSheet();
    timeSheet.workDays.forEach(function(workDay) {
         for (t in workDay.tasks) {
             var task = workDay.tasks[t];
             projectSheet.addTask(task);
         }
    });
    return projectSheet;
}

function process(input) {
    var timeSheet = processTimeSheet(input);
    var projectSheet = groupByProject(timeSheet);

    var timing = '\tSummarize:\n';
    for (d in timeSheet.workDays) {
        var workDay = timeSheet.workDays[d];
        var duration = workDay.summarizeHours();
        timing += moment(workDay.date).format(OUTPUT_DATE_FORMAT) +
                  ' -> ' + moment.utc(duration.asMilliseconds()).format('HH:mm') +
                  (duration.asHours() < 7.5 ? ' (!)' : '') + '\n';
    }

    var output = projectSheet.toString();
    output += '\n\n';
    output += timing;

    return output;
}

$(function() {
    $('#process').on('click', function() {
        var $input = $('#input');
        var $output = $('#output');
        $output.val(process($input.val()));
    });
});