<script>
    import GridItem from '$lib/components/GridItem.svelte';
    import PageTitle from '$lib/components/PageTitle.svelte';

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let showSettings = $state(false);
</script>

<PageTitle>Tan Nguyen</PageTitle>
<GridItem><div style="background: red; width: 50px; height: 50px;"></div></GridItem>

<style>
</style>