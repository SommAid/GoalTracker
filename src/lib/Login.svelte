<script>
    import {User} from '../utils/User.js';

    export let user = new User();
</script>

<style>
    @import '../style/login.css';
</style>

<h1 class=from_intro>Welcome...</h1>
<input class=form_input bind:value={user.name}>
<button class=form_begin>Begin Tracking</button>
