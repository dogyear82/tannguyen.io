<script>
    import { fly } from 'svelte/transition';

    let isVisible = $state(true);
</script>   
    
<div style="background: blue; width: 50px; height: 50px;"
in:fly={{y:(Math.random() - 0.5) * 500, x:(Math.random() - 0.5) * 500, duration: 200}} 
out:fly={{y:(Math.random() - 0.5) * 500, x:(Math.random() - 0.5) * 500, duration: 200}}></div>

<nav>
    <a href="/">home</a>
    <a href="/about-me" on:click={() => isVisible = !isVisible}>about</a>
</nav>

<style>
    a {
        color: white;
    }
</style>