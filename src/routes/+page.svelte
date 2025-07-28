<script>
    import { afterNavigate } from '$app/navigation';
    import PageTitle from '$lib/components/PageTitle.svelte';

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let isHomePage = $state(true);

    afterNavigate(({to}) => {
        isHomePage = to?.url.pathname === '/';
    });
</script>

<div class="home">
    <PageTitle>Welcome!</PageTitle>
</div><!-- .home -->

<style>
    .home {
        width: 100%;
    }
</style>