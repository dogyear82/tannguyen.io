<script>
    import PageTitle from '$lib/components/PageTitle.svelte';

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let showSettings = $state(false);
</script>

<div class="home">
    <PageTitle text={"Welcome!"}></PageTitle>

    <nav>
        <a href="/">home</a>
        <a href="/about-me">about</a>
    </nav>

</div><!-- .home -->

<style>
    .home {
        width: 100%;
    }
</style>