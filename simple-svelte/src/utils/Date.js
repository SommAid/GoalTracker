export class ImportantDate {
    constructor(day, month, year) {
        this.day = null;
        this.month = null;
        this.year = null;
        if (day == null || month == null || year == null)
            this.set_to_today();
        else{
            this.day = day;
            this.month = month;
            this.year = year;
        }
    }

    set_to_today() {
        let date = new Date();
        this.day = date.getDate();
        this.month = date.getMonth() + 1;
        this.year = date.getFullYear();
        return;        
    }

    strFormat() {
        return `${this.year}-${this.month}-${this.day}`;
    }
}

export class DateMath {
    calcTodayFromSignup(start_date, end_date){
        let day_diff = end_date.day - start_date.day;
        let month_diff = end_date.month - start_date.month;
        let year_diff = end_date.year - start_date.year;

        return day_diff + month_diff * 30 + year_diff * 365;    
    }
}
