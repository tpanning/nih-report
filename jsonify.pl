#!/opt/local/bin/perl -w

use strict;
use XML::Twig;
use JSON;

my $twig = XML::Twig->new(
    twig_handlers => {
        row => \&jsonify_row
    }
);
$twig->parsefile('data/RePORTER_PRJ_X_FY2014_170.xml');
#my $root = $twig->root;
#my @rows = $root->children('row');
#foreach my $row (@rows) {
sub jsonify_row {
    my ($t, $row) = @_;
    my $funding_institute = $row->first_child('FUNDING_ICs ')->text;
    ($funding_institute) = $funding_institute =~ m/(^[^:]+)/;
    my @term_elems = $row->first_child('PROJECT_TERMSX')->children('TERM');
    my @terms = ();
    for my $term_elem (@term_elems) {
        push @terms, $term_elem->text;
    }
    my $json = encode_json {
        application_id => $row->first_child('APPLICATION_ID')->text,
        activity => $row->first_child('ACTIVITY')->text,
        administering_ic => $row->first_child('ADMINISTERING_IC')->text,
        application_type => $row->first_child('APPLICATION_TYPE')->text,
        total_cost => $row->first_child('TOTAL_COST')->text,
        award_notice_date => $row->first_child('AWARD_NOTICE_DATE')->text,
        budget_start => $row->first_child('BUDGET_START')->text,
        budget_end => $row->first_child('BUDGET_END')->text,
        project_start => $row->first_child('PROJECT_START')->text,
        project_end => $row->first_child('PROJECT_END')->text,
        foa_number => $row->first_child('FOA_NUMBER')->text,
        project_number => $row->first_child('FULL_PROJECT_NUM')->text,
        fy => $row->first_child('FY')->text,
        title => $row->first_child('PROJECT_TITLE')->text,
        phr => $row->first_child('PHR')->text,
        funding_institute => $funding_institute,
        terms => \@terms
    };
    print $json . "\n";
}
