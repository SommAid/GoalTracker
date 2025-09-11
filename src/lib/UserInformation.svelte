<script>
    class ImportantDate {
        constructor(day, month, year) {
            this.day = day;
            this.month = month;
            this.year = year; 
        }
        
        strFormat() {
            return `${this.year}-${this.month}-${this.day}`;
        }
    }

    var calcTodayFromSignup = (sign_date, today) => {
        let day_diff = today.day - sign_date.day;
        let month_diff = today.month - sign_date.month;
        let year_diff = today.year - sign_date.year;

        return day_diff + month_diff * 30 + year_diff * 365;
         
    }

    let user_name = $state('Aidan Sommer')

    let date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    let activity_streak = $state(5);
    const sign_up_date = new ImportantDate(8, 8, 2025);
    const today_date = new ImportantDate(day, month, year);
    let user_age = calcTodayFromSignup(sign_up_date, today_date);
</script> 

<h1>
    {user_name}
</h1>
<h2>
    {today_date.strFormat()}
</h2>
<h3>
    {user_name} signed-up {user_age} days ago, and is on a {activity_streak} day login streak.
</h3>
