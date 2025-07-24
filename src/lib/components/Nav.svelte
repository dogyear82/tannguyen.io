<script>
    import { afterNavigate } from '$app/navigation';

    import BigNav from './BigNav.svelte';
    import LittleNav from './LittleNav.svelte';

    let isLoaded = $state(false);
    let isHomePage = $state(true);

    afterNavigate(({to}) => {
        isHomePage = to?.url.pathname === '/';
        isLoaded = true;
    });
</script>

<div class="nav">
    {#if isLoaded && isHomePage}
    <BigNav />
    {:else if isLoaded && !isHomePage}
    <LittleNav />
    {/if}
</div>

<style>

</style>