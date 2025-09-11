<script>
    import {User} from '../utils/User.js';

    export let user = new User();
</script>

<h1>Welcome...</h1>
<input bind:value={user.name}>
